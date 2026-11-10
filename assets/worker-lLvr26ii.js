var be=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(n){throw t=0,n}};var Ce=be((je,L)=>{var Ne=Object.defineProperty,s=(e,t)=>Ne(e,"name",{value:t,configurable:!0}),W=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof require<"u"?require:t)[n]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),Se=(()=>{for(var e=new Uint8Array(128),t=0;t<64;t++)e[t<26?t+65:t<52?t+71:t<62?t-4:t*4-205]=t;return n=>{for(var i=n.length,r=new Uint8Array((i-(n[i-1]=="=")-(n[i-2]=="="))*3/4|0),o=0,a=0;o<i;){var l=e[n.charCodeAt(o++)],c=e[n.charCodeAt(o++)],u=e[n.charCodeAt(o++)],f=e[n.charCodeAt(o++)];r[a++]=l<<2|c>>4,r[a++]=c<<4|u>>2,r[a++]=u<<6|f}return r}})();function M(e){return!isNaN(parseFloat(e))&&isFinite(e)}s(M,"_isNumber");function h(e){return e.charAt(0).toUpperCase()+e.substring(1)}s(h,"_capitalize");function x(e){return function(){return this[e]}}s(x,"_getter");var b=["isConstructor","isEval","isNative","isToplevel"],N=["columnNumber","lineNumber"],S=["fileName","functionName","source"],Oe=["args"],Ie=["evalOrigin"],k=b.concat(N,S,Oe,Ie);function p(e){if(e)for(var t=0;t<k.length;t++)e[k[t]]!==void 0&&this["set"+h(k[t])](e[k[t]])}s(p,"StackFrame");p.prototype={getArgs:s(function(){return this.args},"getArgs"),setArgs:s(function(e){if(Object.prototype.toString.call(e)!=="[object Array]")throw new TypeError("Args must be an Array");this.args=e},"setArgs"),getEvalOrigin:s(function(){return this.evalOrigin},"getEvalOrigin"),setEvalOrigin:s(function(e){if(e instanceof p)this.evalOrigin=e;else if(e instanceof Object)this.evalOrigin=new p(e);else throw new TypeError("Eval Origin must be an Object or StackFrame")},"setEvalOrigin"),toString:s(function(){var e=this.getFileName()||"",t=this.getLineNumber()||"",n=this.getColumnNumber()||"",i=this.getFunctionName()||"";return this.getIsEval()?e?"[eval] ("+e+":"+t+":"+n+")":"[eval]:"+t+":"+n:i?i+" ("+e+":"+t+":"+n+")":e+":"+t+":"+n},"toString")};p.fromString=s(function(e){var t=e.indexOf("("),n=e.lastIndexOf(")"),i=e.substring(0,t),r=e.substring(t+1,n).split(","),o=e.substring(n+1);if(o.indexOf("@")===0)var a=/@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(o,""),l=a[1],c=a[2],u=a[3];return new p({functionName:i,args:r||void 0,fileName:l,lineNumber:c||void 0,columnNumber:u||void 0})},"StackFrame$$fromString");for(_=0;_<b.length;_++)p.prototype["get"+h(b[_])]=x(b[_]),p.prototype["set"+h(b[_])]=(function(e){return function(t){this[e]=!!t}})(b[_]);var _;for(v=0;v<N.length;v++)p.prototype["get"+h(N[v])]=x(N[v]),p.prototype["set"+h(N[v])]=(function(e){return function(t){if(!M(t))throw new TypeError(e+" must be a Number");this[e]=Number(t)}})(N[v]);var v;for(E=0;E<S.length;E++)p.prototype["get"+h(S[E])]=x(S[E]),p.prototype["set"+h(S[E])]=(function(e){return function(t){this[e]=String(t)}})(S[E]);var E,R=p;function $(){var e=/^\s*at .*(\S+:\d+|\(native\))/m,t=/^(eval@)?(\[native code])?$/;return{parse:s(function(n){if(n.stack&&n.stack.match(e))return this.parseV8OrIE(n);if(n.stack)return this.parseFFOrSafari(n);throw new Error("Cannot parse given Error object")},"ErrorStackParser$$parse"),extractLocation:s(function(n){if(n.indexOf(":")===-1)return[n];var i=/(.+?)(?::(\d+))?(?::(\d+))?$/,r=i.exec(n.replace(/[()]/g,""));return[r[1],r[2]||void 0,r[3]||void 0]},"ErrorStackParser$$extractLocation"),parseV8OrIE:s(function(n){var i=n.stack.split(`
`).filter(function(r){return!!r.match(e)},this);return i.map(function(r){r.indexOf("(eval ")>-1&&(r=r.replace(/eval code/g,"eval").replace(/(\(eval at [^()]*)|(,.*$)/g,""));var o=r.replace(/^\s+/,"").replace(/\(eval code/g,"(").replace(/^.*?\s+/,""),a=o.match(/ (\(.+\)$)/);o=a?o.replace(a[0],""):o;var l=this.extractLocation(a?a[1]:o),c=a&&o||void 0,u=["eval","<anonymous>"].indexOf(l[0])>-1?void 0:l[0];return new R({functionName:c,fileName:u,lineNumber:l[1],columnNumber:l[2],source:r})},this)},"ErrorStackParser$$parseV8OrIE"),parseFFOrSafari:s(function(n){var i=n.stack.split(`
`).filter(function(r){return!r.match(t)},this);return i.map(function(r){if(r.indexOf(" > eval")>-1&&(r=r.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,":$1")),r.indexOf("@")===-1&&r.indexOf(":")===-1)return new R({functionName:r});var o=/((.*".+"[^@]*)?[^@]*)(?:@)/,a=r.match(o),l=a&&a[1]?a[1]:void 0,c=this.extractLocation(r.replace(o,""));return new R({functionName:l,fileName:c[0],lineNumber:c[1],columnNumber:c[2],source:r})},this)},"ErrorStackParser$$parseFFOrSafari")}}s($,"ErrorStackParser");var Ae=new $,ke=Ae;function B(){if(typeof API<"u"&&API!==globalThis.API)return API.runtimeEnv;let e=typeof Bun<"u",t=typeof Deno<"u",n=typeof process=="object"&&typeof process.versions=="object"&&typeof process.versions.node=="string"&&!process.browser,i=typeof navigator=="object"&&typeof navigator.userAgent=="string"&&navigator.userAgent.indexOf("Chrome")===-1&&navigator.userAgent.indexOf("Safari")>-1,r=typeof read=="function"&&typeof load=="function",o=typeof navigator=="object"&&navigator.userAgent?.includes("Cloudflare-Workers");return H({IN_BUN:e,IN_DENO:t,IN_NODE:n,IN_SAFARI:i,IN_SHELL:r,IN_WORKERD:o})}s(B,"getGlobalRuntimeEnv");var m=B();function H(e){let t=e.IN_NODE&&typeof L<"u"&&L.exports&&typeof W=="function"&&typeof __dirname=="string",n=e.IN_NODE&&!t,i=!e.IN_NODE&&!e.IN_DENO&&!e.IN_BUN,r=i&&typeof window<"u"&&typeof window.document<"u"&&typeof document.createElement=="function"&&"sessionStorage"in window&&typeof globalThis.importScripts!="function",o=i&&typeof globalThis.WorkerGlobalScope<"u"&&typeof globalThis.self<"u"&&globalThis.self instanceof globalThis.WorkerGlobalScope;if(o&&J())throw new Error("Classic web workers are not supported");let a={...e,IN_BROWSER:i,IN_BROWSER_MAIN_THREAD:r,IN_BROWSER_WEB_WORKER:o,IN_NODE_COMMONJS:t,IN_NODE_ESM:n};if(!(a.IN_BROWSER_MAIN_THREAD||a.IN_BROWSER_WEB_WORKER||a.IN_NODE||a.IN_SHELL||a.IN_WORKERD))throw new Error(`Cannot determine runtime environment: ${JSON.stringify(a)}`);return a}s(H,"calculateDerivedFlags");function J(){try{return globalThis.importScripts("data:text/javascript,"),!0}catch{return!1}}s(J,"isClassicWorker");var V,D,j,T;async function C(){if(!m.IN_NODE||(V=(await import("./__vite-browser-external-9wXp6ZBx.js")).default,j=await import("./__vite-browser-external-9wXp6ZBx.js"),T=await import("./__vite-browser-external-9wXp6ZBx.js"),(await import("./__vite-browser-external-9wXp6ZBx.js")).default,D=await import("./__vite-browser-external-9wXp6ZBx.js"),U=D.sep,typeof W<"u"))return;let e=j,t=await import("./__vite-browser-external-9wXp6ZBx.js"),n=await import("./__vite-browser-external-9wXp6ZBx.js"),i=await import("./__vite-browser-external-9wXp6ZBx.js"),r={fs:e,crypto:t,ws:n,child_process:i};globalThis.require=function(o){return r[o]}}s(C,"initNodeModules");function z(e,t){return D.resolve(t||".",e)}s(z,"node_resolvePath");function G(e,t){return t===void 0&&(t=location),new URL(e,t).toString()}s(G,"browser_resolvePath");var I;m.IN_NODE?I=z:m.IN_SHELL?I=s(e=>e,"resolvePath"):I=G;var U;m.IN_NODE||(U="/");function q(e,t){return e.startsWith("file://")&&(e=e.slice(7)),e.includes("://")?{response:fetch(e)}:{binary:T.readFile(e).then(n=>new Uint8Array(n.buffer,n.byteOffset,n.byteLength))}}s(q,"node_getBinaryResponse");function K(e,t){if(e.startsWith("file://")&&(e=e.slice(7)),e.includes("://"))throw new Error("Shell cannot fetch urls");return{binary:Promise.resolve(new Uint8Array(readbuffer(e)))}}s(K,"shell_getBinaryResponse");function Y(e,t){let n=new URL(e,location);return{response:fetch(n,t?{integrity:t}:{})}}s(Y,"browser_getBinaryResponse");var A;m.IN_NODE?A=q:m.IN_SHELL?A=K:A=Y;async function Q(e,t){let{response:n,binary:i}=A(e,t);if(i)return i;let r=await n;if(!r.ok)throw new Error(`Failed to load '${e}': request failed.`);return new Uint8Array(await r.arrayBuffer())}s(Q,"loadBinaryFile");var P;m.IN_NODE?P=X:P=s(async e=>await import(e),"loadScript");async function X(e){return e.startsWith("file://")&&(e=e.slice(7)),e.includes("://")?await import(e):await import(V.pathToFileURL(e).href)}s(X,"nodeLoadScript");async function Z(e){if(m.IN_NODE){await C();let t=await T.readFile(e,{encoding:"utf8"});return JSON.parse(t)}else if(m.IN_SHELL){let t=read(e);return JSON.parse(t)}else return await(await fetch(e)).json()}s(Z,"loadLockFile");async function ee(){if(m.IN_NODE_COMMONJS)return __dirname;let e;try{throw new Error}catch(i){e=i}let t=ke.parse(e)[0].fileName;if(m.IN_NODE&&!t.startsWith("file://")&&(t=`file://${t}`),m.IN_NODE_ESM){let i=await import("./__vite-browser-external-9wXp6ZBx.js");return(await import("./__vite-browser-external-9wXp6ZBx.js")).fileURLToPath(i.dirname(t))}let n=t.lastIndexOf(U);if(n===-1)throw new Error("Could not extract indexURL path from pyodide module location. Please pass the indexURL explicitly to loadPyodide.");return t.slice(0,n)}s(ee,"calculateDirname");function te(e){return e.substring(0,e.lastIndexOf("/")+1)||globalThis.location?.toString()||"."}s(te,"calculateInstallBaseUrl");function ne(e){let t=e.FS,n=e.FS.filesystems.MEMFS,i=e.PATH,r={DIR_MODE:16895,FILE_MODE:33279,mount:s(function(o){if(!o.opts.fileSystemHandle)throw new Error("opts.fileSystemHandle is required");return n.mount.apply(null,arguments)},"mount"),syncfs:s(async(o,a,l)=>{try{let c=r.getLocalSet(o),u=await r.getRemoteSet(o),f=a?u:c,y=a?c:u;await r.reconcile(o,f,y),l(null)}catch(c){l(c)}},"syncfs"),getLocalSet:s(o=>{let a=Object.create(null);function l(f){return f!=="."&&f!==".."}s(l,"isRealDir");function c(f){return y=>i.join2(f,y)}s(c,"toAbsolute");let u=t.readdir(o.mountpoint).filter(l).map(c(o.mountpoint));for(;u.length;){let f=u.pop(),y=t.stat(f);t.isDir(y.mode)&&u.push.apply(u,t.readdir(f).filter(l).map(c(f))),a[f]={timestamp:y.mtime,mode:y.mode}}return{type:"local",entries:a}},"getLocalSet"),getRemoteSet:s(async o=>{let a=Object.create(null),l=await Fe(o.opts.fileSystemHandle);for(let[c,u]of l)c!=="."&&(a[i.join2(o.mountpoint,c)]={timestamp:u.kind==="file"?new Date((await u.getFile()).lastModified):new Date,mode:u.kind==="file"?r.FILE_MODE:r.DIR_MODE});return{type:"remote",entries:a,handles:l}},"getRemoteSet"),loadLocalEntry:s(o=>{let a=t.lookupPath(o,{}).node,l=t.stat(o);if(t.isDir(l.mode))return{timestamp:l.mtime,mode:l.mode};if(t.isFile(l.mode))return a.contents=n.getFileDataAsTypedArray(a),{timestamp:l.mtime,mode:l.mode,contents:a.contents};throw new Error("node type not supported")},"loadLocalEntry"),storeLocalEntry:s((o,a)=>{if(t.isDir(a.mode))t.mkdirTree(o,a.mode);else if(t.isFile(a.mode))t.writeFile(o,a.contents,{canOwn:!0});else throw new Error("node type not supported");t.chmod(o,a.mode),t.utime(o,a.timestamp,a.timestamp)},"storeLocalEntry"),removeLocalEntry:s(o=>{var a=t.stat(o);t.isDir(a.mode)?t.rmdir(o):t.isFile(a.mode)&&t.unlink(o)},"removeLocalEntry"),loadRemoteEntry:s(async o=>{if(o.kind==="file"){let a=await o.getFile();return{contents:new Uint8Array(await a.arrayBuffer()),mode:r.FILE_MODE,timestamp:new Date(a.lastModified)}}else{if(o.kind==="directory")return{mode:r.DIR_MODE,timestamp:new Date};throw new Error("unknown kind: "+o.kind)}},"loadRemoteEntry"),storeRemoteEntry:s(async(o,a,l)=>{let c=o.get(i.dirname(a)),u=t.isFile(l.mode)?await c.getFileHandle(i.basename(a),{create:!0}):await c.getDirectoryHandle(i.basename(a),{create:!0});if(u.kind==="file"){let f=await u.createWritable();await f.write(l.contents),await f.close()}o.set(a,u)},"storeRemoteEntry"),removeRemoteEntry:s(async(o,a)=>{await o.get(i.dirname(a)).removeEntry(i.basename(a)),o.delete(a)},"removeRemoteEntry"),reconcile:s(async(o,a,l)=>{let c=0,u=[];Object.keys(a.entries).forEach(function(d){let g=a.entries[d],w=l.entries[d];(!w||t.isFile(g.mode)&&g.timestamp.getTime()>w.timestamp.getTime())&&(u.push(d),c++)}),u.sort();let f=[];if(Object.keys(l.entries).forEach(function(d){a.entries[d]||(f.push(d),c++)}),f.sort().reverse(),!c)return;let y=a.type==="remote"?a.handles:l.handles;for(let d of u){let g=i.normalize(d.replace(o.mountpoint,"/")).substring(1);if(l.type==="local"){let w=y.get(g),we=await r.loadRemoteEntry(w);r.storeLocalEntry(d,we)}else{let w=r.loadLocalEntry(d);await r.storeRemoteEntry(y,g,w)}}for(let d of f)if(l.type==="local")r.removeLocalEntry(d);else{let g=i.normalize(d.replace(o.mountpoint,"/")).substring(1);await r.removeRemoteEntry(y,g)}},"reconcile")};e.FS.filesystems.NATIVEFS_ASYNC=r}s(ne,"initializeNativeFS");var Fe=s(async e=>{let t=[];async function n(r){for await(let o of r.values())t.push(o),o.kind==="directory"&&await n(o)}s(n,"collect"),await n(e);let i=new Map;i.set(".",e);for(let r of t){let o=(await e.resolve(r)).join("/");i.set(o,r)}return i},"getFsHandles"),xe=Se("AGFzbQEAAAABDANfAGAAAW9gAW8BfwMDAgECBygCE0pzdl9HZXRFcnJvcl9pbXBvcnQAAA5Kc3ZFcnJvcl9DaGVjawABChMCBwD7AQD7GwsJACAA+xr7FAAL"),Re=(async function(){if(!(globalThis.navigator&&(/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&typeof navigator.maxTouchPoints<"u"&&navigator.maxTouchPoints>1)))try{let e=await WebAssembly.compile(xe);return await WebAssembly.instantiate(e)}catch(e){if(e instanceof WebAssembly.CompileError)return;throw e}})();async function re(){let e=await Re;if(e)return e.exports;let t=Symbol("error marker");return{Jsv_GetError_import:s(()=>t,"Jsv_GetError_import"),JsvError_Check:s(n=>n===t,"JsvError_Check")}}s(re,"getJsvErrorImport");function oe(e){let t={config:e,runtimeEnv:m},n={noImageDecoding:!0,noAudioDecoding:!0,noWasmDecoding:!1,preRun:ue(e),print:e.stdout,printErr:e.stderr,onExit(i){n.exitCode=i},thisProgram:e._sysExecutable,arguments:e.args,API:t,locateFile:s(i=>e.indexURL+i,"locateFile"),instantiateWasm:fe(e.indexURL)};return n}s(oe,"createSettings");function ie(e){return function(t){let n="/";try{t.FS.mkdirTree(e)}catch(i){console.error(`Error occurred while making a home directory '${e}':`),console.error(i),console.error(`Using '${n}' for a home directory instead`),e=n}t.FS.chdir(e)}}s(ie,"createHomeDirectory");function ae(e){return function(t){Object.assign(t.ENV,e)}}s(ae,"setEnvironment");function se(e){return e?[async t=>{t.addRunDependency("fsInitHook");try{await e(t.FS,{sitePackages:t.API.sitePackages})}finally{t.removeRunDependency("fsInitHook")}}]:[]}s(se,"callFsInitHook");function le(e){let t=e.HEAPU32[e._Py_Version>>>2],n=t>>>24&255,i=t>>>16&255,r=t>>>8&255;return[n,i,r]}s(le,"computeVersionTuple");function ce(e){let t=Q(e);return async n=>{n.API.pyVersionTuple=le(n);let[i,r]=n.API.pyVersionTuple;n.FS.mkdirTree("/lib"),n.API.sitePackages=`/lib/python${i}.${r}/site-packages`,n.FS.mkdirTree(n.API.sitePackages),n.FS.mkdirTree(`/lib/python${i}.${r}/lib-dynload`),n.addRunDependency("install-stdlib");try{let o=await t;n.FS.writeFile(`/lib/python${i}${r}.zip`,o)}catch(o){console.error("Error occurred while installing the standard library:"),console.error(o)}finally{n.removeRunDependency("install-stdlib")}}}s(ce,"installStdlib");function ue(e){let t;return e.stdLibURL!=null?t=e.stdLibURL:t=e.indexURL+"python_stdlib.zip",[ce(t),ie(e.env.HOME),ae(e.env),ne,...se(e.fsInit)]}s(ue,"getFileSystemInitializationFuncs");function fe(e){if(typeof WasmOffsetConverter<"u")return;let{binary:t,response:n}=A(e+"pyodide.asm.wasm"),i=re();return function(r,o){return(async function(){let{Jsv_GetError_import:a,JsvError_Check:l}=await i;r.env.Jsv_GetError_import=a,r.env.JsvError_Check=l;try{let c;n?c=await WebAssembly.instantiateStreaming(n,r):c=await WebAssembly.instantiate(await t,r);let{instance:u,module:f}=c;o(u,f)}catch(c){console.warn("wasm instantiation failed!"),console.warn(c)}})(),{}}}s(fe,"getInstantiateWasmFunc");var De="314.0.7";function O(e){return e===void 0||e.endsWith("/")?e:e+"/"}s(O,"withTrailingSlash");var F=De;async function de(e={}){if(await C(),e.lockFileContents&&e.lockFileURL)throw new Error("Can't pass both lockFileContents and lockFileURL");let t=e.indexURL||await ee();if(t=O(I(t)),e.packageBaseUrl=O(e.packageBaseUrl),e.cdnUrl=O(e.packageBaseUrl??`https://cdn.jsdelivr.net/pyodide/v${F}/full/`),!e.lockFileContents){let r=e.lockFileURL??t+"pyodide-lock.json";e.lockFileContents=Z(r),e.packageBaseUrl??=te(r)}e.indexURL=t,e.packageCacheDir&&(e.packageCacheDir=O(I(e.packageCacheDir)));let n={jsglobals:globalThis,stdin:globalThis.prompt?()=>globalThis.prompt():void 0,args:[],env:{},packages:[],packageCacheDir:e.packageBaseUrl,enableRunUntilComplete:!0,checkAPIVersion:!0,BUILD_ID:"990c3b51a9722d62434de2bbc9643732658d488c1b6d467f22c1b6beba80d497"},i=Object.assign(n,e);return i.env.HOME??="/home/pyodide",i.env.PYTHONINSPECT??="1",i}s(de,"initializeConfiguration");function pe(e){let t=oe(e),n=t.API;return n.lockFilePromise=Promise.resolve(e.lockFileContents),t}s(pe,"createEmscriptenSettings");async function me(e){if(e.createPyodideModule)return e.createPyodideModule;let t=`${e.indexURL}pyodide.asm.mjs`;return(await P(t)).default}s(me,"loadWasmScript");async function ye(e,t){if(!e._loadSnapshot)return;let n=await e._loadSnapshot,i=ArrayBuffer.isView(n)?n:new Uint8Array(n);return t.noInitialRun=!0,t.INITIAL_MEMORY=i.length,i}s(ye,"prepareSnapshot");async function he(e,t){let n=await e(t);if(t.exitCode!==void 0)throw new n.ExitStatus(t.exitCode);return n}s(he,"instantiatePyodideModule");function ge(e,t){let n=e.API;if(t.pyproxyToStringRepr&&n.setPyProxyToStringMethod(!0),t.convertNullToNone&&n.setCompatNullToNone(!0),t.toJsLiteralMap&&n.setCompatToJsLiteralMap(!0),n.version!==F&&t.checkAPIVersion)throw new Error(`Pyodide version does not match: '${F}' <==> '${n.version}'. If you updated the Pyodide version, make sure you also updated the 'indexURL' parameter passed to loadPyodide.`);e.locateFile=i=>{throw i.endsWith(".so")?new Error(`Failed to find dynamic library "${i}"`):new Error(`Unexpected call to locateFile("${i}")`)}}s(ge,"configureAPI");function _e(e,t,n){let i=e.API,r;return t&&(r=i.restoreSnapshot(t)),i.finalizeBootstrap(r,n._snapshotDeserializer)}s(_e,"bootstrapPyodide");async function ve(e,t){let n=e._api;return n.sys.path.insert(0,""),n._pyodide.set_excepthook(),await n.packageIndexReady,n.initializeStreams(t.stdin,t.stdout,t.stderr),e}s(ve,"finalizeSetup");async function Ee(e={}){let t=await de(e),n=pe(t),i=await me(t),r=await ye(t,n),o=await he(i,n);ge(o,t);let a=_e(o,r,t);return await ve(a,t)}s(Ee,"loadPyodide");var Pe=`import builtins
import contextlib
import inspect
import io
import json
import traceback

STUDENT_FILE = "<aluno>"

_namespace = {}


class Elevator:
    def __init__(self, snapshot, commands, fleet):
        self._snapshot = snapshot
        self._commands = commands
        self._fleet = fleet
        self._target = snapshot["target_floor"]

    def move_to(self, floor):
        low, high = self._snapshot["min_floor"], self._snapshot["max_floor"]
        if isinstance(floor, bool) or not isinstance(floor, int):
            raise ValueError(f"move_to espera um andar inteiro, recebeu {floor!r}")
        if not low <= floor <= high:
            raise ValueError(f"move_to({floor}): andar fora do prédio (de {low} a {high})")
        command = {"type": "move_to", "floor": floor}
        if self.id() != 0:
            command["elevator"] = self.id()
        self._commands.append(command)
        self._target = floor

    def id(self):
        return self._snapshot.get("id", 0)

    def is_service(self):
        return self._snapshot.get("service", False)

    def fleet(self):
        return list(self._fleet)

    def current_floor(self):
        return self._snapshot["current_floor"]

    def target_floor(self):
        return self._target

    def direction(self):
        return self._snapshot["direction"]

    def is_idle(self):
        return self._snapshot["idle"]

    def min_floor(self):
        return self._snapshot["min_floor"]

    def max_floor(self):
        return self._snapshot["max_floor"]

    def __repr__(self):
        return f"<Elevator id={self.id()} andar={self.current_floor()} target={self.target_floor()}>"


def _positional_count(handler):
    try:
        parameters = list(inspect.signature(handler).parameters.values())
    except (TypeError, ValueError):
        return 0
    if any(p.kind == inspect.Parameter.VAR_POSITIONAL for p in parameters):
        return float("inf")
    positional = (inspect.Parameter.POSITIONAL_ONLY, inspect.Parameter.POSITIONAL_OR_KEYWORD)
    return sum(1 for p in parameters if p.kind in positional)


def _call_button_elevator(fleet, event):
    service = event.get("service", False)
    return next((e for e in fleet if e.is_service() == service), fleet[0])


def _dispatch(handler, fleet, event):
    if event["type"] == "call_button":
        elevator = _call_button_elevator(fleet, event)
        count = _positional_count(handler)
        arguments = [event["floor"], event.get("direction"), event.get("service", False)]
        handler(elevator, *arguments[: max(2, min(count, 4)) - 1])
        return
    elevator = fleet[event.get("elevator", 0)]
    if event["type"] == "idle":
        handler(elevator)
    else:
        handler(elevator, event["floor"])


def _student_line(error):
    frames = [f for f in traceback.extract_tb(error.__traceback__) if f.filename == STUDENT_FILE]
    return frames[-1].lineno if frames else None


def _exception(error):
    result = {"kind": "exception", "message": f"{type(error).__name__}: {error}"}
    line = _student_line(error)
    if line is not None:
        result["line"] = line
    return result


def _syntax(error):
    result = {"kind": "syntax", "message": f"Erro de sintaxe: {error.msg}"}
    if error.lineno is not None:
        result["line"] = error.lineno
    return result


def load(code):
    global _namespace
    _namespace = {"__name__": "__aluno__", "__builtins__": builtins}
    try:
        compiled = compile(code, STUDENT_FILE, "exec")
    except SyntaxError as error:
        return json.dumps(_syntax(error))
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compiled, _namespace)
    except Exception as error:
        _namespace = {}
        return json.dumps(_exception(error))
    return json.dumps(None)


def handle(batch_json):
    batch = json.loads(batch_json)
    commands = []
    fleet = []
    for snapshot in batch.get("elevators") or [batch["elevator"]]:
        fleet.append(Elevator(snapshot, commands, fleet))
    output = io.StringIO()
    try:
        with contextlib.redirect_stdout(output):
            for event in batch["events"]:
                handler = _namespace.get("on_" + event["type"])
                if not callable(handler):
                    continue
                _dispatch(handler, fleet, event)
    except Exception as error:
        return json.dumps({"error": _exception(error)})
    return json.dumps({"commands": commands, "logs": output.getvalue().splitlines()})
`;function Le(e,t,n){const i=t().then(r=>{const o=r.globals.get("dict")();return r.runPython(n,{globals:o}),{load:o.get("load"),handle:o.get("handle")}});i.then(()=>e.post({type:"ready"}),r=>e.post({type:"boot_error",message:String(r)})),e.listen(async r=>{const{load:o,handle:a}=await i;r.type==="load"?e.post({id:r.id,type:"load",result:JSON.parse(o(r.code))}):e.post({id:r.id,type:"handle",result:JSON.parse(a(JSON.stringify(r.batch)))})})}const Te=`https://cdn.jsdelivr.net/pyodide/v${F}/full/`;Le({post:e=>self.postMessage(e),listen:e=>self.addEventListener("message",t=>e(t.data))},()=>Ee({indexURL:Te}),Pe)});export default Ce();
