#!/usr/bin/env python3
"""Validador do grafo de docs (só biblioteca padrão).

Uso: python3 docs/scripts/validate.py [--repo-root PATH]   (default: raiz do repo)
Saída: uma linha por violação `SEVERITY | RULE | arquivo:linha | mensagem`.
Exit 1 se houver algum ERROR.

Regras:
  FRONTMATTER_MISSING  ERROR  doc sem frontmatter, `id` ou `status`
  INVALID_STATUS       ERROR  status fora da lista
  DUPLICATE_ID         ERROR  mesmo `id` em dois docs
  SPEC_WITHOUT_RF      ERROR  SPEC sem RF em `parents`
  BROKEN_REF           ERROR  ID citado (frontmatter, corpo ou teste) que não existe
  AC_WITHOUT_TEST      WARN/ERROR  AC-N sem teste citando SPEC-NNN/AC-N (ERROR se approved/done)
  TOO_LONG             WARN   doc acima do limite de linhas do tipo
"""
import argparse
import os
import re
import sys

STATUSES = {"draft", "review", "approved", "done", "superseded", "deprecated"}
REF_FIELDS = ["parents", "related", "superseded_by"]
MAX_LINES = {"ADR": 40, "SPEC": 120}

DOCS_DIR = "docs"
GOVERNED_DIRS = {"decisions", "specs"}
GOVERNED_FILES = {"requirements.md", "architecture.md"}
EXCLUDED_DIRS = {".git", "node_modules", "dist", "build", "coverage", ".venv", "venv",
                 "__pycache__", ".vite", ".turbo"}

AC_MARKER_RE = re.compile(r"^\s*#\s*AC-(\d+)\s*$")    # `# AC-N` acima do Cenário gherkin
AC_REF_RE = re.compile(r"\b(SPEC-\d+)/AC-(\d+)\b")
REQ_ITEM_RE = re.compile(r"\b(?:RF|RNF|RN)-\d+\b")
BODY_REF_RE = re.compile(r"\b(?:SPEC|ADR|RF|RNF|RN)-\d+\b")
FIELD_RE = re.compile(r"^([A-Za-z_]\w*):\s*(.*?)\s*(?:#.*)?$")


def out(sev, rule, file, line, msg):
    return (file, line, f"{sev} | {rule} | {file}:{line} | {msg}", sev)


def parse_frontmatter(lines):
    """-> ({campo: (valor, linha)}, linha_fim) ou (None, 0) se não houver frontmatter."""
    if not lines or lines[0].strip() != "---":
        return None, 0
    fields = {}
    for i, raw in enumerate(lines[1:], start=2):
        if raw.strip() == "---":
            return fields, i
        m = FIELD_RE.match(raw)
        if m:
            fields[m.group(1)] = (m.group(2), i)
    return None, 0


def as_list(raw):
    raw = raw.strip().strip("[]")
    return [x.strip() for x in raw.split(",") if x.strip() and x.strip() != "null"]


def walk(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDED_DIRS]
        for name in filenames:
            yield os.path.join(dirpath, name)


def is_governed(root, path):
    rel = os.path.relpath(path, root).split(os.sep)
    if rel[0] != DOCS_DIR or not path.endswith(".md"):
        return False
    return (len(rel) == 2 and rel[1] in GOVERNED_FILES) or (len(rel) == 3 and rel[1] in GOVERNED_DIRS)


def validate(root):
    found, docs, known, seen = [], [], {"GLO"}, {}
    for path in sorted(p for p in walk(root) if is_governed(root, p)):
        rel = os.path.relpath(path, root)
        with open(path, encoding="utf-8", errors="replace") as f:
            lines = f.read().splitlines()
        if os.path.basename(path) == "requirements.md":
            known.update(m.group(0) for line in lines for m in REQ_ITEM_RE.finditer(line))
        fm, fm_end = parse_frontmatter(lines)
        if fm is None:
            found.append(out("ERROR", "FRONTMATTER_MISSING", rel, 1, "sem frontmatter"))
            continue
        doc_id = fm.get("id", ("", 1))[0]
        if "NNN" in doc_id:
            continue  # template
        for field in ("id", "status"):
            if not fm.get(field, ("", 1))[0]:
                found.append(out("ERROR", "FRONTMATTER_MISSING", rel, 1, field))
        if doc_id:
            if doc_id in seen:
                found.append(out("ERROR", "DUPLICATE_ID", rel, 1, f"{doc_id} já usado em {seen[doc_id]}"))
            seen[doc_id] = rel
            known.add(doc_id)
            docs.append((rel, doc_id, fm, fm_end, lines))

    ac_refs = {}
    for path in walk(root):
        if is_governed(root, path):
            continue
        try:
            if os.path.getsize(path) > 2_000_000:
                continue
            with open(path, encoding="utf-8") as f:
                content = f.read()
        except (OSError, UnicodeDecodeError):
            continue
        for n, line in enumerate(content.splitlines(), start=1):
            for m in AC_REF_RE.finditer(line):
                ac_refs.setdefault(m.group(1), {}).setdefault(int(m.group(2)), []).append(
                    (os.path.relpath(path, root), n))

    spec_acs = {}
    for rel, doc_id, fm, fm_end, lines in docs:
        prefix = doc_id.split("-")[0]
        status, status_line = fm.get("status", ("", 1))
        if status and status not in STATUSES:
            found.append(out("ERROR", "INVALID_STATUS", rel, status_line, status))

        for field in REF_FIELDS:
            value, line = fm.get(field, ("", 1))
            for ref in as_list(value):
                if ref not in known:
                    found.append(out("ERROR", "BROKEN_REF", rel, line, f"{ref} inexistente"))
        for n, line in enumerate(lines[fm_end:], start=fm_end + 1):
            for m in BODY_REF_RE.finditer(line):
                if m.group(0) not in known:
                    found.append(out("ERROR", "BROKEN_REF", rel, n, f"{m.group(0)} inexistente"))

        limit = MAX_LINES.get(prefix)
        if limit and len(lines) > limit:
            found.append(out("WARN", "TOO_LONG", rel, limit,
                             f"{len(lines)} linhas (máx {limit}) — corte ou divida"))

        if prefix != "SPEC":
            continue
        parents, parents_line = fm.get("parents", ("", 1))
        if not any(p.startswith("RF-") for p in as_list(parents)):
            found.append(out("ERROR", "SPEC_WITHOUT_RF", rel, parents_line, "SPEC sem RF em parents"))
        acs = {int(m.group(1)): i for i, l in enumerate(lines, start=1)
               if (m := AC_MARKER_RE.match(l))}
        spec_acs[doc_id] = acs
        sev = "ERROR" if status in ("approved", "done") else "WARN"
        for ac, line in sorted(acs.items()):
            if ac not in ac_refs.get(doc_id, {}):
                found.append(out(sev, "AC_WITHOUT_TEST", rel, line, f"AC-{ac} sem teste"))

    for spec_id, acs in ac_refs.items():
        for ac, locations in acs.items():
            if ac not in spec_acs.get(spec_id, {}):
                for rel, n in locations:
                    found.append(out("ERROR", "BROKEN_REF", rel, n, f"{spec_id}/AC-{ac} inexistente"))

    return sorted(found)


def main():
    default_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
    parser = argparse.ArgumentParser(description="Validador do grafo de docs")
    parser.add_argument("--repo-root", default=default_root)
    parser.add_argument("--quiet-warn", action="store_true", help="mostra só ERROR")
    args = parser.parse_args()
    violations = validate(os.path.abspath(args.repo_root))
    for *_, text, sev in violations:
        if not (args.quiet_warn and sev == "WARN"):
            print(text)
    sys.exit(1 if any(v[3] == "ERROR" for v in violations) else 0)


if __name__ == "__main__":
    main()
