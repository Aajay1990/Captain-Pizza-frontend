import{r as i,g as h}from"./react-CjXjvctv.js";/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=(...r)=>r.filter((e,o,n)=>!!e&&e.trim()!==""&&n.indexOf(e)===o).join(" ").trim();/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=r=>r.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=r=>r.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,o,n)=>n?n.toUpperCase():o.toLowerCase());/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=r=>{const e=w(r);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var C={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=r=>{for(const e in r)if(e.startsWith("aria-")||e==="role"||e==="title")return!0;return!1};/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=i.forwardRef(({color:r="currentColor",size:e=24,strokeWidth:o=2,absoluteStrokeWidth:n,className:c="",children:t,iconNode:s,...a},f)=>i.createElement("svg",{ref:f,...C,width:e,height:e,stroke:r,strokeWidth:n?Number(o)*24/Number(e):o,className:p("lucide",c),...!t&&!x(a)&&{"aria-hidden":"true"},...a},[...s.map(([m,d])=>i.createElement(m,d)),...Array.isArray(t)?t:[t]]));/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=(r,e)=>{const o=i.forwardRef(({className:n,...c},t)=>i.createElement(v,{ref:t,iconNode:e,className:p(`lucide-${y(l(r))}`,`lucide-${r}`,n),...c}));return o.displayName=l(r),o};/**
 * @license lucide-react v0.575.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]],j=g("shopping-cart",A);var u={exports:{}};/*!
	Copyright (c) 2018 Jed Watson.
	Licensed under the MIT License (MIT), see
	http://jedwatson.github.io/classnames
*/(function(r){(function(){var e={}.hasOwnProperty;function o(){for(var t="",s=0;s<arguments.length;s++){var a=arguments[s];a&&(t=c(t,n(a)))}return t}function n(t){if(typeof t=="string"||typeof t=="number")return t;if(typeof t!="object")return"";if(Array.isArray(t))return o.apply(null,t);if(t.toString!==Object.prototype.toString&&!t.toString.toString().includes("[native code]"))return t.toString();var s="";for(var a in t)e.call(t,a)&&t[a]&&(s=c(s,a));return s}function c(t,s){return s?t?t+" "+s:t+s:t}r.exports?(o.default=o,r.exports=o):window.classNames=o})()})(u);var b=u.exports;const k=h(b);export{j as S,k as c};
