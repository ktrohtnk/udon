// canvas.js - Handles visual rendering and animation

let canvas, ctx;
let width, height;
let noodles = [];
let currentPath = null;
export let currentViewMode = 'side';
let activeSoupColor = '#3366ff';
export let noodleThickness = 'thick';
export let noodleHardness = 'soft';
export let currentTool = 'noodle';
export let visualToppings = [];

// Bowl properties
const bowl = {
    radiusOuter: 0,
    radiusInner: 0,
    x: 0,
    y: 0
};

export function initCanvas(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    
    resize();
    window.addEventListener('resize', resize);
    
    setupInput();
    requestAnimationFrame(render);
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    
    bowl.x = width / 2;
    bowl.y = height / 2;
    bowl.radiusOuter = Math.min(width, height) * 0.35;
    bowl.radiusInner = bowl.radiusOuter * 0.9;
}

export function setSoupColor(color) {
    activeSoupColor = color;
}

export function setViewMode(mode) {
    currentViewMode = mode;
}

export function setNoodleThickness(thick) {
    noodleThickness = thick;
}

export function setNoodleHardness(hard) {
    noodleHardness = hard;
}

export function clearCanvas() {
    noodles = [];
    visualToppings = [];
    window.dispatchEvent(new CustomEvent('toppingsUpdated'));
}

export function getNoodlesData() {
    return noodles;
}

export function setDrawTool(tool) {
    currentTool = tool;
}

export function getActiveToppings() {
    const active = new Set();
    visualToppings.forEach(t => active.add(t.type));
    return Array.from(active);
}

function addTopping(x, y, type) {
    let X = x - bowl.x;
    let Y = 0, Z = 0;
    
    if (currentViewMode === 'side') {
        const topY = bowl.y + bowl.radiusOuter * 0.2;
        Y = y - topY;
        Z = (Math.random() - 0.5) * bowl.radiusOuter * 0.5; 
    } else {
        X = x - bowl.x;
        Z = y - bowl.y;
        Y = (Math.random() - 0.5) * bowl.radiusOuter * 0.5;
    }
    
    visualToppings.push({
        type: type,
        x: X,
        y: Y, 
        z: Z,
        scale: 0.7 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        seed: Math.random() * 1000
    });
    
    window.dispatchEvent(new CustomEvent('toppingsUpdated'));
}

// Input Handling
function setupInput() {
    let isDrawing = false;
    
    const startDraw = (e) => {
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        if (currentTool !== 'noodle') {
            addTopping(clientX, clientY, currentTool);
            return;
        }

        isDrawing = true;
        
        currentPath = {
            points: [],
            phase: Math.random() * Math.PI * 2,
            seed: Math.random() * 1000,
            thickness: noodleThickness,
            hardness: noodleHardness,
            drawnIn: currentViewMode
        };
        addPoint(e);
    };
    
    const moveDraw = (e) => {
        if (!isDrawing) return;
        addPoint(e);
    };
    
    const endDraw = () => {
        if (!isDrawing) return;
        isDrawing = false;
        if (currentPath && currentPath.points.length > 5) {
            noodles.push(currentPath);
        }
        currentPath = null;
        window.dispatchEvent(new CustomEvent('noodlesUpdated'));
    };
    
    const addPoint = (e) => {
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        const i = currentPath.points.length;
        const phase = currentPath.phase;
        const R = bowl.radiusOuter;
        let X = 0, Y = 0, Z = 0;
        
        if (currentViewMode === 'side') {
            const topY = bowl.y + R * 0.2;
            X = clientX - bowl.x;
            Y = clientY - topY;
            Z = Math.sin(i * 0.15 + phase) * (R * 0.4) + Math.cos(i * 0.05 + phase * 2) * (R * 0.2);
        } else {
            X = clientX - bowl.x;
            Z = clientY - bowl.y;
            Y = R * 0.4 + Math.sin(i * 0.15 + phase) * (R * 0.3);
        }
        
        currentPath.points.push({ x: clientX, y: clientY, X, Y, Z });
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveDraw(e); }, {passive: false});
    window.addEventListener('touchend', endDraw);
}

// Render Loop
function render(time) {
    ctx.clearRect(0, 0, width, height);
    
    if (currentViewMode === 'side') {
        renderSideView(time);
    } else {
        renderTopView(time);
    }
    
    requestAnimationFrame(render);
}

function renderItems(targetItems, currentP, time, fillColor = '#fff', isSubmerged = false) {
    targetItems.forEach(item => {
        if (item.type) {
            drawTopping(item, time, 'outline', fillColor, isSubmerged);
            drawTopping(item, time, 'fill', fillColor, isSubmerged);
        } else {
            drawNoodlePath(item, time, false, 'outline', fillColor, isSubmerged);
            drawNoodlePath(item, time, false, 'fill', fillColor, isSubmerged);
            if (item.hardness === 'hard' || item.hardness === 'cube') {
                drawNoodlePath(item, time, false, 'innerEdge', fillColor, isSubmerged);
            }
        }
    });
    if (currentP) {
        drawNoodlePath(currentP, time, true, 'outline', fillColor, isSubmerged);
        drawNoodlePath(currentP, time, true, 'fill', fillColor, isSubmerged);
        if (currentP.hardness === 'hard' || currentP.hardness === 'cube') {
            drawNoodlePath(currentP, time, true, 'innerEdge', fillColor, isSubmerged);
        }
    }
}

function getDepth(item) {
    if (item.type) {
        return currentViewMode === 'side' ? (item.z || 0) : -(item.y || 0);
    }
    if (!item.points || item.points.length === 0) return 0;
    let sum = 0;
    for (let pt of item.points) {
        if (currentViewMode === 'side') {
            sum += (pt.Z || 0);
        } else {
            sum -= (pt.Y || 0);
        }
    }
    return sum / item.points.length;
}

function renderSideView(time) {
    const topY = bowl.y + bowl.radiusOuter * 0.2;
    const soupColor = activeSoupColor;
    
    // Soup physics
    const soupLevel = topY + bowl.radiusOuter * 0.3;
    const dy = soupLevel - topY;
    const soupRadiusX = Math.sqrt(Math.pow(bowl.radiusOuter, 2) - Math.pow(dy, 2));
    const theta = Math.asin(dy / bowl.radiusOuter);

    // 1. Draw Soup Volume (Color Fill)
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = -soupRadiusX + (soupRadiusX * 2) * t;
        const wave = Math.sin(x * 0.05 + time * 0.003) * 6;
        if (i === 0) ctx.moveTo(bowl.x + x, soupLevel + wave);
        else ctx.lineTo(bowl.x + x, soupLevel + wave);
    }
    ctx.arc(bowl.x, topY, bowl.radiusOuter, theta, Math.PI - theta, false);
    ctx.closePath();
    ctx.fillStyle = soupColor;
    ctx.fill();

    // 2. Draw Soup Surface Line (Black Stroke)
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = -soupRadiusX + (soupRadiusX * 2) * t;
        const wave = Math.sin(x * 0.05 + time * 0.003) * 6;
        if (i === 0) ctx.moveTo(bowl.x + x, soupLevel + wave);
        else ctx.lineTo(bowl.x + x, soupLevel + wave);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // 3. Draw Back of Glass Bowl Rim
    ctx.beginPath();
    ctx.ellipse(bowl.x, topY, bowl.radiusOuter, bowl.radiusOuter * 0.15, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    // 4. Draw Items (Full: White Fill + Black Outline)
    const allItems = [...noodles, ...visualToppings].sort((a, b) => getDepth(a) - getDepth(b));
    renderItems(allItems, currentPath, time, '#fff');

    // 5. Draw Noodles (Clipped to Soup: Color Fill)
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = -soupRadiusX + (soupRadiusX * 2) * t;
        const wave = Math.sin(x * 0.05 + time * 0.003) * 6;
        if (i === 0) ctx.moveTo(bowl.x + x, soupLevel + wave);
        else ctx.lineTo(bowl.x + x, soupLevel + wave);
    }
    ctx.arc(bowl.x, topY, bowl.radiusOuter, theta, Math.PI - theta, false);
    ctx.closePath();
    ctx.clip();
    
    // Redraw only fills with soupColor and isSubmerged = true for refraction
    renderItems(allItems, currentPath, time, soupColor, true);
    ctx.restore();

    // 6. Draw Front of Glass Bowl Rim
    ctx.beginPath();
    ctx.ellipse(bowl.x, topY, bowl.radiusOuter, bowl.radiusOuter * 0.15, 0, 0, Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // 7. Draw Glass Bowl Body
    ctx.beginPath();
    ctx.arc(bowl.x, topY, bowl.radiusOuter, 0, Math.PI, false);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.stroke();
}

function renderTopView(time) {
    const soupColor = activeSoupColor;

    // Soup is a circle inside
    ctx.beginPath();
    ctx.arc(bowl.x, bowl.y, bowl.radiusInner, 0, Math.PI * 2);
    ctx.fillStyle = soupColor;
    ctx.fill();

    // Draw Glass Bowl Outer Rim
    ctx.beginPath();
    ctx.arc(bowl.x, bowl.y, bowl.radiusOuter, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    // Draw Glass Bowl Inner Rim
    ctx.beginPath();
    ctx.arc(bowl.x, bowl.y, bowl.radiusInner, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Items
    const allItems = [...noodles, ...visualToppings].sort((a, b) => getDepth(a) - getDepth(b));
    renderItems(allItems, currentPath, time, '#fff');
}

function drawTopping(topping, time, layerType, soupColorOverride, isSubmerged = false) {
    const topY = bowl.y + bowl.radiusOuter * 0.2;
    let px = bowl.x + topping.x;
    let py = currentViewMode === 'side' ? (topY + topping.y) : (bowl.y + topping.z);
    
    ctx.save();
    ctx.translate(px, py);
    
    const timeSec = time * 0.001;
    const floatY = Math.sin(timeSec * 2 + topping.seed) * 5;
    const floatRot = Math.cos(timeSec * 1.5 + topping.seed) * 0.1;
    
    ctx.translate(0, floatY);
    ctx.rotate(topping.rotation + floatRot);
    ctx.scale(topping.scale, topping.scale);
    
    if (isSubmerged) {
        ctx.scale(1.25, 1.25); // Refraction magnification
        const wobbleX = Math.sin(timeSec * 4 + topping.seed) * 3;
        const wobbleY = Math.cos(timeSec * 3 + topping.seed) * 3;
        ctx.translate(wobbleX, wobbleY);
    }
    
    let baseColor = '#fff';
    switch(topping.type) {
        case 'negi': baseColor = '#00E553'; break;
        case 'wakame': baseColor = '#00502A'; break;
        case 'gobo': baseColor = '#FFC800'; break;
        case 'maru': baseColor = '#FF5E00'; break;
        case 'niku': baseColor = '#662E1C'; break;
    }
    const fill = soupColorOverride !== '#fff' ? soupColorOverride : baseColor;
    
    if (topping.type === 'negi') {
        const drawThickRing = (ox, oy, rOut, rIn, h, tilt, aspect) => {
            ctx.save();
            ctx.translate(ox, oy);
            ctx.rotate(tilt);
            
            const outerTop = new Path2D();
            outerTop.ellipse(0, 0, rOut, rOut * aspect, 0, 0, Math.PI * 2);
            const innerTop = new Path2D();
            innerTop.ellipse(0, 0, rIn, rIn * aspect, 0, 0, Math.PI * 2);
            
            if (layerType === 'outline') {
                // Drawn in fill pass to ensure 1px delicate outline without fill interference
            } else {
                const neonColor = '#00EA65';
                const darkColor = '#00B82E';
                const innerDarkColor = '#008F24';
                
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#000';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                // 1. Inner Back Wall (Draw FIRST so top face covers any overextending parts)
                ctx.fillStyle = innerDarkColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, rIn, rIn * aspect, 0, Math.PI, Math.PI * 2); 
                ctx.lineTo(rIn, h);
                ctx.ellipse(0, h, rIn, rIn * aspect, 0, Math.PI * 2, Math.PI, true);
                ctx.closePath();
                ctx.fill();
                
                // Inner Back Wall Outline (No vertical tangents, only bottom curve)
                ctx.beginPath();
                ctx.ellipse(0, h, rIn, rIn * aspect, 0, Math.PI, Math.PI * 2);
                ctx.stroke();
                
                // 2. Outer Front Wall
                ctx.fillStyle = darkColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, rOut, rOut * aspect, 0, 0, Math.PI); 
                ctx.lineTo(-rOut, h);
                ctx.ellipse(0, h, rOut, rOut * aspect, 0, Math.PI, 0, true); 
                ctx.closePath();
                ctx.fill();
                
                // Outer Front Wall Outline
                ctx.beginPath();
                ctx.ellipse(0, h, rOut, rOut * aspect, 0, 0, Math.PI);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(rOut, 0); ctx.lineTo(rOut, h);
                ctx.moveTo(-rOut, 0); ctx.lineTo(-rOut, h);
                ctx.stroke();
                
                // 3. Top Face (Draw LAST to perfectly occlude the inside)
                ctx.fillStyle = neonColor;
                const topFace = new Path2D();
                topFace.addPath(outerTop);
                topFace.addPath(innerTop);
                ctx.fill(topFace, 'evenodd');
                
                // Top Face Outline
                ctx.stroke(outerTop);
                ctx.stroke(innerTop);
            }
            ctx.restore();
        };
        
        const count = 4;
        for (let i = 0; i < count; i++) {
            const r1 = Math.sin(topping.seed + i * 1.1);
            const r2 = Math.cos(topping.seed + i * 1.2);
            const r3 = Math.sin(topping.seed + i * 1.3);
            const r4 = Math.cos(topping.seed + i * 1.4);
            
            const dx = r1 * 28;
            const dy = r2 * 20;
            
            const baseAspect = currentViewMode === 'side' ? 0.5 : 0.9;
            const aspect = Math.max(0.15, baseAspect + (r3 * 0.3));
            const tilt = r4 * Math.PI * 2;
            
            const rOut = 10 + Math.abs(r1) * 6;
            const thickness = 3 + Math.abs(r2) * 5;
            const rIn = Math.max(2, rOut - thickness);
            const h = 4 + Math.abs(r3) * 6;
            
            drawThickRing(dx, dy, rOut, rIn, h, tilt, aspect);
        }
    } 
    else if (topping.type === 'maru') {
        const path = new Path2D();
        if (currentViewMode === 'side') {
            path.ellipse(0, 0, 45, 18, 0, 0, Math.PI * 2);
        } else {
            path.arc(0, 0, 45, 0, Math.PI * 2);
        }
        
        if (layerType === 'outline') {
            ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.stroke(path);
        } else {
            ctx.fillStyle = fill; ctx.fill(path);
        }
    }
    else if (topping.type === 'wakame') {
        ctx.save();
        if (currentViewMode === 'side') ctx.scale(1, 0.4);
        const path = new Path2D();
        path.arc(-15, -10, 25, Math.PI, 0);
        path.arc(25, -10, 20, Math.PI, 0, true);
        path.lineTo(40, 20);
        path.lineTo(-40, 20);
        path.closePath();
        
        if (layerType === 'outline') {
            ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.stroke(path);
        } else {
            ctx.fillStyle = fill; ctx.fill(path);
        }
        ctx.restore();
    }
    else if (topping.type === 'niku') {
        ctx.save();
        if (currentViewMode === 'side') ctx.scale(1, 0.5);
        
        const path1 = new Path2D();
        path1.arc(-10, 0, 25, Math.PI, 0);
        path1.closePath();
        
        const path2 = new Path2D();
        path2.rect(5, -15, 20, 35);
        
        const path3 = new Path2D();
        path3.arc(-20, 10, 15, 0, Math.PI * 2);

        if (layerType === 'outline') {
            ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
            ctx.stroke(path1);
            ctx.stroke(path2);
            ctx.stroke(path3);
        } else {
            ctx.fillStyle = fill; 
            ctx.fill(path1);
            ctx.fill(path3);
            ctx.fillStyle = soupColorOverride !== '#fff' ? soupColorOverride : '#F2D1A8';
            ctx.fill(path2);
        }
        ctx.restore();
    }
    else if (topping.type === 'gobo') {
        const drawSlice = (ox, oy) => {
            ctx.save(); ctx.translate(ox, oy);
            ctx.rotate(-Math.PI / 4);
            const path = new Path2D();
            if (currentViewMode === 'side') {
                path.ellipse(0, 0, 35, 12, 0, 0, Math.PI * 2);
            } else {
                path.ellipse(0, 0, 40, 16, 0, 0, Math.PI * 2);
            }
            if (layerType === 'outline') {
                ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.stroke(path);
            } else {
                ctx.fillStyle = fill; ctx.fill(path);
            }
            ctx.restore();
        };
        drawSlice(-18, 12);
        drawSlice(0, 0);
        drawSlice(18, -12);
    }
    
    ctx.restore();
}

function drawNoodlePath(noodle, time, isDrawing = false, layerType = 'fill', fillColor = '#fff', isSubmerged = false) {
    if (noodle.points.length < 2) return;
    
    const timeSec = time * 0.001;
    const topY = bowl.y + bowl.radiusOuter * 0.2;
    
    let animatedPoints = noodle.points.map((pt, i) => {
        let px = pt.x, py = pt.y;
        if (pt.X !== undefined) {
            if (currentViewMode === 'side') {
                px = bowl.x + pt.X;
                py = topY + pt.Y;
            } else {
                px = bowl.x + pt.X;
                py = bowl.y + pt.Z;
            }
        }
        
        if (isDrawing) return { x: px, y: py }; 
        
        let waveX = Math.sin(i * 0.1 + timeSec * 2 + noodle.phase) * 5;
        let waveY = Math.cos(i * 0.05 + timeSec * 1.5 + noodle.seed) * 5;
        
        if (isSubmerged) {
            // Refraction wobble
            waveX += Math.sin(py * 0.05 + timeSec * 5 + i * 0.1) * 4;
            waveY += Math.cos(px * 0.05 + timeSec * 4 + i * 0.1) * 4;
        }
        
        return { x: px + waveX, y: py + waveY };
    });

    const nThick = noodle.thickness || 'thick';
    const nHard = noodle.hardness || 'soft';
    const isHard = nHard === 'hard';
    const isThick = nThick === 'thick';

    if (isHard) {
        ctx.lineCap = 'butt'; 
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;
        animatedPoints = animatedPoints.filter((pt, i) => i % 4 === 0 || i === animatedPoints.length - 1);
    } else {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    if (animatedPoints.length < 2) return;
    
    let fillWidth = isThick ? 40 : 16;
    let outWidth = isThick ? 42 : 18;
    
    if (isSubmerged) {
        fillWidth *= 1.35; // 35% thicker due to water magnification
        outWidth *= 1.35;
    }

    if (layerType === 'outline' || layerType === 'fill') {
        const path = new Path2D();
        path.moveTo(animatedPoints[0].x, animatedPoints[0].y);
        
        if (isHard) {
            for (let i = 1; i < animatedPoints.length; i++) {
                path.lineTo(animatedPoints[i].x, animatedPoints[i].y);
            }
        } else {
            for (let i = 1; i < animatedPoints.length - 2; i++) {
                const xc = (animatedPoints[i].x + animatedPoints[i + 1].x) / 2;
                const yc = (animatedPoints[i].y + animatedPoints[i + 1].y) / 2;
                path.quadraticCurveTo(animatedPoints[i].x, animatedPoints[i].y, xc, yc);
            }
            if (animatedPoints.length > 2) {
                path.quadraticCurveTo(
                    animatedPoints[animatedPoints.length - 2].x, 
                    animatedPoints[animatedPoints.length - 2].y, 
                    animatedPoints[animatedPoints.length - 1].x, 
                    animatedPoints[animatedPoints.length - 1].y
                );
            }
        }

        if (layerType === 'outline') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = outWidth;
            ctx.stroke(path);
        } else if (layerType === 'fill') {
            ctx.strokeStyle = fillColor;
            ctx.lineWidth = fillWidth;
            ctx.stroke(path);
        }
    } else if (layerType === 'innerEdge') {
        if (isHard) {
            let W = fillWidth / 2;
            let shift = isThick ? 8 : 3;
            let ext = isThick ? 15 : 6;
            
            if (isSubmerged) {
                shift *= 1.35;
                ext *= 1.35;
            }
            
            const pFirst = animatedPoints[0], pSecond = animatedPoints[1];
            const dx_s = pSecond.x - pFirst.x, dy_s = pSecond.y - pFirst.y;
            const len_s = Math.sqrt(dx_s*dx_s + dy_s*dy_s) || 1;
            const inX_s = dx_s / len_s, inY_s = dy_s / len_s;
            const nx_s = -inY_s, ny_s = inX_s;
            
            const A_s = { x: pFirst.x - nx_s * W, y: pFirst.y - ny_s * W };
            const C_s = { x: pFirst.x + nx_s * W, y: pFirst.y + ny_s * W };
            // Extrude FORWARD along path to prevent overlapping the inner edge
            const E_s = { x: pFirst.x + nx_s * shift + inX_s * ext, y: pFirst.y + ny_s * shift + inY_s * ext };
            const P4_s = { x: A_s.x + C_s.x - E_s.x, y: A_s.y + C_s.y - E_s.y };

            const pLast = animatedPoints[animatedPoints.length-1], pPrev = animatedPoints[animatedPoints.length-2];
            const dx_e = pLast.x - pPrev.x, dy_e = pLast.y - pPrev.y;
            const len_e = Math.sqrt(dx_e*dx_e + dy_e*dy_e) || 1;
            const outX_e = dx_e / len_e, outY_e = dy_e / len_e;
            const nx_e = -outY_e, ny_e = outX_e;
            
            const A_e = { x: pLast.x - nx_e * W, y: pLast.y - ny_e * W };
            const C_e = { x: pLast.x + nx_e * W, y: pLast.y + ny_e * W };
            // Extrude FORWARD along path
            const E_e = { x: pLast.x + nx_e * shift + outX_e * ext, y: pLast.y + ny_e * shift + outY_e * ext };

            // 1. Draw inner edge
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            for (let i = 0; i < animatedPoints.length; i++) {
                if (i === 0) {
                    ctx.moveTo(E_s.x, E_s.y);
                    continue;
                }
                if (i === animatedPoints.length - 1) {
                    ctx.lineTo(E_e.x, E_e.y);
                    continue;
                }
                
                const p0 = animatedPoints[i-1], p1 = animatedPoints[i], p2 = animatedPoints[i+1];
                const dx_in = p1.x - p0.x, dy_in = p1.y - p0.y;
                const len_in = Math.sqrt(dx_in*dx_in + dy_in*dy_in) || 1;
                const n_inx = -dy_in / len_in, n_iny = dx_in / len_in;

                const dx_out = p2.x - p1.x, dy_out = p2.y - p1.y;
                const len_out = Math.sqrt(dx_out*dx_out + dy_out*dy_out) || 1;
                const n_outx = -dy_out / len_out, n_outy = dx_out / len_out;

                let nx = n_inx + n_outx;
                let ny = n_iny + n_outy;
                const len_n = Math.sqrt(nx*nx + ny*ny) || 1;
                nx /= len_n; ny /= len_n;
                
                const dot = nx * n_inx + ny * n_iny;
                if (dot > 0.1) {
                    nx /= dot; ny /= dot;
                }

                ctx.lineTo(p1.x + nx * shift, p1.y + ny * shift);
            }
            ctx.stroke();

            // 2. Draw Start Koguchi (Faces camera: full parallelogram)
            ctx.beginPath();
            ctx.moveTo(A_s.x, A_s.y);
            ctx.lineTo(E_s.x, E_s.y);
            ctx.lineTo(C_s.x, C_s.y);
            ctx.lineTo(P4_s.x, P4_s.y);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 3. Draw End Koguchi (Faces away: only back V-shape sticking out)
            ctx.beginPath();
            ctx.moveTo(A_e.x, A_e.y);
            ctx.lineTo(E_e.x, E_e.y);
            ctx.lineTo(C_e.x, C_e.y);
            ctx.fillStyle = fillColor;
            ctx.fill(); 
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
}
