(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/HeatmapIframe.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>HeatmapIframe)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function HeatmapIframe({ src, title = "Heatmap Report", className = "w-full rounded-lg border", minHeight = 800 }) {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HeatmapIframe.useEffect": ()=>{
            const iframe = ref.current;
            if (!iframe) return;
            const onLoad = {
                "HeatmapIframe.useEffect.onLoad": ()=>{
                    try {
                        const doc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (doc) {
                            const h = Math.max(doc.body?.scrollHeight || 0, doc.documentElement?.scrollHeight || 0, minHeight);
                            iframe.style.height = `${h}px`;
                        }
                    } catch  {
                        iframe.style.height = `${minHeight}px`;
                    }
                }
            }["HeatmapIframe.useEffect.onLoad"];
            iframe.addEventListener("load", onLoad);
            return ({
                "HeatmapIframe.useEffect": ()=>iframe.removeEventListener("load", onLoad)
            })["HeatmapIframe.useEffect"];
        }
    }["HeatmapIframe.useEffect"], [
        src,
        minHeight
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
        ref: ref,
        src: src,
        title: title,
        className: className,
        style: {
            minHeight
        },
        sandbox: "allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox",
        loading: "lazy",
        referrerPolicy: "no-referrer"
    }, void 0, false, {
        fileName: "[project]/src/components/HeatmapIframe.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
_s(HeatmapIframe, "8uVE59eA/r6b92xF80p7sH8rXLk=");
_c = HeatmapIframe;
var _c;
__turbopack_context__.k.register(_c, "HeatmapIframe");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/HeatmapIframe.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/HeatmapIframe.tsx [app-client] (ecmascript)"));
}}),
}]);

//# sourceMappingURL=src_components_HeatmapIframe_tsx_976fb117._.js.map