// main.js - Application entry point and UI logic

import { initAudio, toggleTopping, updateNoodles, clearNoodles as audioClear } from './audio.js?v=4';
import { initCanvas, setSoupColor, clearCanvas, getNoodlesData, setViewMode, setNoodleThickness, setNoodleHardness, setDrawTool, getActiveToppings, setPhysicsMode, setBowlPattern } from './canvas.js?v=4';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const app = document.getElementById('app');
    const canvasEl = document.getElementById('main-canvas');
    const clearBtn = document.getElementById('clear-btn');
    const exportBtn = document.getElementById('export-svg-btn');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const colorBtns = document.querySelectorAll('.color-btn');
    const viewBtns = document.querySelectorAll('.view-btn');
    const bowlBtns = document.querySelectorAll('.bowl-btn');
    const physicsBtns = document.querySelectorAll('.physics-btn');
    const thickBtns = document.querySelectorAll('.thick-btn');
    const hardBtns = document.querySelectorAll('.hard-btn');

    // View Mode Toggle
    viewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            viewBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            setViewMode(e.currentTarget.dataset.view);
        });
    });

    // Bowl Pattern Toggle
    bowlBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            bowlBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            setBowlPattern(e.currentTarget.dataset.pattern);
        });
    });

    // Physics Mode Toggle
    physicsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            physicsBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            setPhysicsMode(e.currentTarget.dataset.physics === 'collide');
        });
    });

    // Color Toggle
    colorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            colorBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            setSoupColor(e.currentTarget.dataset.color);
        });
    });

    // Thickness Toggle
    thickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            thickBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            setNoodleThickness(e.currentTarget.dataset.thick);
        });
    });

    // Hardness Toggle
    hardBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            hardBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            setNoodleHardness(e.currentTarget.dataset.hard);
        });
    });

    // Start Audio and App on User Interaction
    startBtn.addEventListener('click', async () => {
        try {
            await initAudio();
            initCanvas(canvasEl);
            
            startScreen.classList.add('hidden');
            app.classList.remove('hidden');
        } catch (e) {
            console.error("Failed to initialize:", e);
            alert("エラーが発生しました。ブラウザがWeb Audio APIをサポートしているか確認してください。");
        }
    });

    // Tool Selection
    toolBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toolBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            setDrawTool(e.currentTarget.dataset.tool);
        });
    });

    // Sync Audio Effects with Placed Toppings
    window.addEventListener('toppingsUpdated', () => {
        const activeTypes = getActiveToppings();
        ['negi', 'wakame', 'gobo', 'maru', 'niku'].forEach(type => {
            toggleTopping(type, activeTypes.includes(type));
        });
    });


    // Clear Bowl
    clearBtn.addEventListener('click', () => {
        clearCanvas();
        audioClear();
    });

    // Export Image
    exportBtn.addEventListener('click', () => {
        if (window.exportHighResImage) {
            window.exportHighResImage();
        }
    });

    // Listen to custom event from canvas when drawing finishes
    window.addEventListener('noodlesUpdated', () => {
        const data = getNoodlesData();
        // Convert canvas paths to a format for audio sequencing
        const mappedData = data.map(noodle => {
            return {
                path: noodle.points,
                length: noodle.points.length,
                baseColor: noodle.baseColor
            };
        });
        updateNoodles(mappedData);
    });
});
