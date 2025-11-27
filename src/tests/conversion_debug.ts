import { OperationTracer } from "../OperationTracer.js";
import { OPERATIONS } from "../operations/Operations.js";
import { ZeroOrdinal } from "../types/ZeroOrdinal.js";
import { OneOrdinal } from "../types/OneOrdinal.js";
import { FiniteOrdinal } from "../types/FiniteOrdinal.js";
import { OmegaOrdinal } from "../types/OmegaOrdinal.js";
import { CNFOrdinal } from "../types/CNFOrdinal.js";
import { ENFOrdinal } from "../types/ENFOrdinal.js";
import { ENFTerm } from "../types/ENFTerm.js";
import { ENFFactor } from "../types/ENFFactor.js";
import { EpsilonZero } from "../types/EpsilonZero.js";
import { EpsilonNumber } from "../types/EpsilonNumber.js";
import { WTowerOrdinal } from "../types/WTowerOrdinal.js";
import { EpsilonTowerOrdinal } from "../types/EpsilonTowerOrdinal.js";
import { EpsilonTunnelOrdinal } from "../types/EpsilonTunnelOrdinal.js";
import { ZetaZero } from "../types/ZetaZero.js";
import { initializeTestEnvironment } from "./testEnvironment.js";

// @ts-nocheck

// Extracted from conversion_debug.html

// Original <scripttype="module">

        initializeTestEnvironment(1000000);
        console.log('[Test] Conversion debug initialized');

        // Now that initialization is complete, run the rendering code
        (function () {
            const out = document.getElementById('matrix');
            const diag = document.getElementById('diag');
            const graphHost = document.getElementById('graph');

            function renderMatrix() {
                try {
                    OPERATIONS.initialize();
                    const types = OPERATIONS.registry.getTypeNames();
                    const engine = OPERATIONS.conversionEngine;
                    let html = '<table><thead><tr><th>Source \\ Target</th>';
                    for (const t of types) html += `<th>${t}</th>`;
                    html += '</tr></thead><tbody>';

                    for (const src of types) {
                        html += `<tr><th>${src}</th>`;
                        const TypeClass = OPERATIONS.registry.getTypeClass(src);
                        let instance;
                        try {
                            const tracer = new OperationTracer(1000);
                            if (src === 'Zero') instance = new ZeroOrdinal(tracer);
                            else if (src === 'One') instance = new OneOrdinal(tracer);
                            else if (src === 'Finite') instance = new FiniteOrdinal(2, tracer);
                            else if (src === 'Omega') instance = new OmegaOrdinal(tracer);
                            else if (src === 'CNF') instance = new CNFOrdinal(0, tracer);
                            else if (src === 'WTower') instance = new WTowerOrdinal(2, tracer);
                            else if (src === 'EpsilonZero') instance = new EpsilonZero(tracer);
                            else if (src === 'EpsilonNumber') instance = new EpsilonNumber(new ZeroOrdinal(tracer), tracer); // e_0
                            else if (src === 'EpsilonTower') instance = new EpsilonTowerOrdinal(new ZeroOrdinal(tracer), 2, tracer); // e_0^^2
                            else if (src === 'EpsilonTunnel') instance = new EpsilonTunnelOrdinal(2, tracer); // e__2
                            else if (src === 'ZetaZero') instance = new ZetaZero(tracer);
                            else if (src === 'ENF') instance = new ENFOrdinal([new ENFTerm([], 5n, tracer)], tracer); // finite 5 as ENF
                            else if (src === 'ENFTerm') instance = new ENFTerm([], 5n, tracer);
                            else if (src === 'ENFFactor') instance = new ENFFactor(new OmegaOrdinal(tracer), new OneOrdinal(tracer)); // ω^1
                            else instance = new TypeClass(tracer);
                        } catch (e) {
                            instance = null;
                        }

                        for (const dst of types) {
                            let cls = 'no';
                            let txt = 'no';
                            try {
                                if (!instance) {
                                    cls = 'err';
                                    txt = 'err';
                                } else {
                                    const can = engine.canConvert(instance, dst);
                                    if (can) {
                                        const before = instance.toStringWithType ? instance.toStringWithType() : String(instance);
                                        let afterStr = '';
                                        try {
                                            const converted = engine.convert(instance, dst);
                                            afterStr = converted && converted.toStringWithType ? converted.toStringWithType() : String(converted);
                                            cls = 'yes';
                                            txt = `${before} → ${afterStr}`;
                                        } catch (convErr) {
                                            cls = 'err';
                                            txt = `${before} → err`;
                                        }
                                    } else {
                                        cls = 'no';
                                        txt = 'no';
                                    }
                                }
                            } catch (err) {
                                cls = 'err';
                                txt = 'err';
                            }
                            html += `<td class="${cls}">${txt}</td>`;
                        }
                        html += '</tr>';
                    }
                    html += '</tbody></table>';
                    out.innerHTML = html;

                    const diagInfo = OPERATIONS.getDiagnostics();
                    diag.textContent = JSON.stringify(diagInfo, null, 2);
                    renderGraph(diagInfo.registeredTypes);
                } catch (e) {
                    out.textContent = 'Initialization error: ' + e.message;
                }
            }

            function renderGraph(typeNames) {
                // Build direct conversion adjacency from registry
                const registry = OPERATIONS.registry;
                const direct = registry.directConversions; // Map
                const types = Array.from(typeNames);

                // Prepare edge maps
                const edgesFrom = new Map();
                const edgesTo = new Map();
                for (const t of types) { edgesFrom.set(t, new Set()); edgesTo.set(t, new Set()); }
                for (const [src, targets] of direct.entries()) {
                    if (!edgesFrom.has(src)) continue;
                    for (const dst of targets) {
                        if (!edgesFrom.has(dst)) continue;
                        edgesFrom.get(src).add(dst);
                        edgesTo.get(dst).add(src);
                    }
                }

                // Layering via Kahn-like pass
                const indegree = new Map(types.map(t => [t, edgesTo.get(t).size]));
                const layer = new Map();
                const queue = [];
                for (const t of types) if (indegree.get(t) === 0) { layer.set(t, 0); queue.push(t); }
                while (queue.length) {
                    const u = queue.shift();
                    const lu = layer.get(u) || 0;
                    for (const v of edgesFrom.get(u)) {
                        if (!layer.has(v) || layer.get(v) < lu + 1) layer.set(v, lu + 1);
                        indegree.set(v, (indegree.get(v) || 0) - 1);
                        if (indegree.get(v) === 0) queue.push(v);
                    }
                }
                // Any remaining (cycles): assign layer 0
                for (const t of types) if (!layer.has(t)) layer.set(t, 0);

                const maxLayer = Math.max(...Array.from(layer.values()));
                const layers = Array.from({ length: maxLayer + 1 }, () => []);
                for (const t of types) layers[layer.get(t)].push(t);

                // SVG layout
                const width = 960, layerGap = 110, nodeW = 120, nodeH = 36, marginX = 40, marginY = 20;
                const height = (maxLayer + 1) * layerGap + marginY * 2;

                // Create SVG
                graphHost.innerHTML = '';
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', String(width));
                svg.setAttribute('height', String(height));
                svg.style.border = '1px solid #ddd';

                // Arrow marker
                const defs = document.createElementNS(svg.namespaceURI, 'defs');
                const marker = document.createElementNS(svg.namespaceURI, 'marker');
                marker.setAttribute('id', 'arrow');
                marker.setAttribute('viewBox', '0 0 10 10');
                marker.setAttribute('refX', '10');
                marker.setAttribute('refY', '5');
                marker.setAttribute('markerWidth', '6');
                marker.setAttribute('markerHeight', '6');
                marker.setAttribute('orient', 'auto-start-reverse');
                const arrowPath = document.createElementNS(svg.namespaceURI, 'path');
                arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
                arrowPath.setAttribute('fill', '#888');
                marker.appendChild(arrowPath);
                defs.appendChild(marker);
                svg.appendChild(defs);

                // Compute node positions
                const positions = new Map();
                for (let l = 0; l <= maxLayer; l++) {
                    const nodes = layers[l];
                    const count = nodes.length || 1;
                    const totalWidth = width - marginX * 2;
                    const step = count > 1 ? totalWidth / (count - 1) : 0;
                    const y = marginY + l * layerGap;
                    for (let i = 0; i < nodes.length; i++) {
                        const xCenter = marginX + (count === 1 ? totalWidth / 2 : i * step);
                        positions.set(nodes[i], { x: xCenter - nodeW / 2, y });
                    }
                }

                // Draw edges first
                for (const [src, targets] of edgesFrom.entries()) {
                    for (const dst of targets) {
                        const ps = positions.get(src), pd = positions.get(dst);
                        if (!ps || !pd) continue;
                        const x1 = ps.x + nodeW / 2, y1 = ps.y + nodeH;
                        const x2 = pd.x + nodeW / 2, y2 = pd.y;
                        const path = document.createElementNS(svg.namespaceURI, 'path');
                        const mx = (x1 + x2) / 2;
                        const d = `M ${x1} ${y1} C ${mx} ${y1 + 30}, ${mx} ${y2 - 30}, ${x2} ${y2}`;
                        path.setAttribute('d', d);
                        path.setAttribute('fill', 'none');
                        path.setAttribute('stroke', '#888');
                        path.setAttribute('stroke-width', '1.5');
                        path.setAttribute('marker-end', 'url(#arrow)');
                        svg.appendChild(path);
                    }
                }

                // Draw nodes
                for (const t of types) {
                    const pos = positions.get(t);
                    if (!pos) continue;
                    const g = document.createElementNS(svg.namespaceURI, 'g');
                    const rect = document.createElementNS(svg.namespaceURI, 'rect');
                    rect.setAttribute('x', String(pos.x));
                    rect.setAttribute('y', String(pos.y));
                    rect.setAttribute('width', String(nodeW));
                    rect.setAttribute('height', String(nodeH));
                    rect.setAttribute('rx', '6');
                    rect.setAttribute('ry', '6');
                    rect.setAttribute('fill', '#eef5ff');
                    rect.setAttribute('stroke', '#1d4ed8');
                    rect.setAttribute('stroke-width', '1');
                    const text = document.createElementNS(svg.namespaceURI, 'text');
                    text.setAttribute('x', String(pos.x + nodeW / 2));
                    text.setAttribute('y', String(pos.y + nodeH / 2 + 4));
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('font-family', 'monospace');
                    text.setAttribute('font-size', '12');
                    text.textContent = t;
                    g.appendChild(rect);
                    g.appendChild(text);
                    svg.appendChild(g);
                }

                graphHost.appendChild(svg);
            }

            // OPERATIONS is already initialized above in this module script
            // Just render the matrix
            renderMatrix();
        })();
