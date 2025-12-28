import type { OrdinalBase } from "../types/OrdinalBase.js";
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
import { requireElementById } from "./testUtils.js";

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// Extracted from conversion_debug.html

// Original <scripttype="module">

        initializeTestEnvironment(1000000);
        console.log('[Test] Conversion debug initialized');

        const matrixContainer = requireElementById<HTMLDivElement>('matrix');
        const diagContainer = requireElementById<HTMLElement>('diag');
        const graphContainer = requireElementById<HTMLDivElement>('graph');

        function instantiateSample(typeName: string): OrdinalBase | null {
            try {
                switch (typeName) {
                    case 'Zero':
                        return ZeroOrdinal.instance();
                    case 'One':
                        return OneOrdinal.instance();
                    case 'Finite':
                        return new FiniteOrdinal(2);
                    case 'Omega':
                        return OmegaOrdinal.instance();
                    case 'CNF':
                        return new CNFOrdinal(0);
                    case 'WTower':
                        return new WTowerOrdinal(2);
                    case 'EpsilonZero':
                        return EpsilonZero.instance();
                    case 'EpsilonNumber':
                        return new EpsilonNumber(ZeroOrdinal.instance());
                    case 'EpsilonTower':
                        return new EpsilonTowerOrdinal(ZeroOrdinal.instance(), 2);
                    case 'EpsilonTunnel':
                        return new EpsilonTunnelOrdinal(2);
                    case 'ZetaZero':
                        return ZetaZero.instance();
                    case 'ENF':
                        return new ENFOrdinal([new ENFTerm([], 5n)]);
                    case 'ENFTerm':
                console.warn('[ConversionDebug] ENFTerm is not an OrdinalBase; skipping sample.');
                return null;
                    case 'ENFFactor':
                console.warn('[ConversionDebug] ENFFactor is not an OrdinalBase; skipping sample.');
                return null;
                    default: {
                        const TypeClass = OPERATIONS.registry.getTypeClass(typeName);
                        if (!TypeClass) {
                            throw new Error(`Unknown ordinal type: ${typeName}`);
                        }
                        return new TypeClass();
                    }
                }
            } catch (error) {
                console.error('[ConversionDebug] Failed to instantiate', typeName, error);
                return null;
            }
        }

        // Now that initialization is complete, run the rendering code
        (function () {

            function renderMatrix(): void {
                try {
                    OPERATIONS.initialize();
                    const types = OPERATIONS.registry.getTypeNames();
                    const engine = OPERATIONS.conversionEngine;
                    let html = '<table><thead><tr><th>Source \\ Target</th>';
                    for (const t of types) html += `<th>${t}</th>`;
                    html += '</tr></thead><tbody>';

                    for (const src of types) {
                        html += `<tr><th>${src}</th>`;
                        const instance = instantiateSample(src);

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
                    matrixContainer.innerHTML = html;

                    const diagInfo = OPERATIONS.getDiagnostics();
                    diagContainer.textContent = JSON.stringify(diagInfo, null, 2);
                    renderGraph(diagInfo.registeredTypes ?? []);
                } catch (error: unknown) {
                    matrixContainer.textContent = 'Initialization error: ' + toErrorMessage(error);
                }
            }

            function renderGraph(typeNames: string[] = []): void {
                // Build direct conversion adjacency from registry
                const registry = OPERATIONS.registry as unknown as { directConversions?: Map<string, Set<string>> };
                const direct: Map<string, Set<string>> = registry.directConversions ?? new Map<string, Set<string>>();
                const types: string[] = Array.isArray(typeNames) ? [...typeNames] : [];

                // Prepare edge maps
                const edgesFrom = new Map<string, Set<string>>();
                const edgesTo = new Map<string, Set<string>>();
                for (const t of types) { edgesFrom.set(t, new Set()); edgesTo.set(t, new Set()); }
                for (const [src, targets] of direct.entries()) {
                    if (!edgesFrom.has(src)) continue;
                    for (const dst of targets) {
                        if (!edgesFrom.has(dst)) continue;
                        edgesFrom.get(src)!.add(dst);
                        edgesTo.get(dst)!.add(src);
                    }
                }

                // Layering via Kahn-like pass
                const indegree = new Map(types.map(t => [t, edgesTo.get(t)!.size]));
                const layer = new Map<string, number>();
                const queue: string[] = [];
                for (const t of types) if ((indegree.get(t) ?? 0) === 0) { layer.set(t, 0); queue.push(t); }
                while (queue.length) {
                    const u = queue.shift();
                    if (u === undefined) {
                        break;
                    }
                    const lu = layer.get(u) || 0;
                    for (const v of edgesFrom.get(u) ?? []) {
                        if (!layer.has(v) || (layer.get(v) ?? 0) < lu + 1) layer.set(v, lu + 1);
                        indegree.set(v, (indegree.get(v) ?? 0) - 1);
                        if ((indegree.get(v) ?? 0) === 0) queue.push(v);
                    }
                }
                // Any remaining (cycles): assign layer 0
                for (const t of types) if (!layer.has(t)) layer.set(t, 0);

                const maxLayer = layer.size > 0 ? Math.max(...Array.from(layer.values())) : 0;
                const layers: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
                for (const t of types) {
                    const layerIndex = layer.get(t) ?? 0;
                    layers[layerIndex].push(t);
                }

                // SVG layout
                const width = 960, layerGap = 110, nodeW = 120, nodeH = 36, marginX = 40, marginY = 20;
                const height = (Math.max(0, maxLayer) + 1) * layerGap + marginY * 2;

                // Create SVG
                graphContainer.innerHTML = '';
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
                const positions = new Map<string, { x: number; y: number }>();
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

                graphContainer.appendChild(svg);
            }

            // OPERATIONS is already initialized above in this module script
            // Just render the matrix
            renderMatrix();
        })();
