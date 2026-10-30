/* eslint-env node */
// Run against a local Vite server (5174) and a dedicated headless Chromium CDP port (9333).
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const output = process.argv[2];
if (!output) throw new Error('Pass a screenshot output directory');
await mkdir(output, { recursive: true });
const target = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map();
const exceptions = [];
socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
});
const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
    });
const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
};
const waitFor = async (expression) => {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
        try {
            if (await evaluate(`Boolean(${expression})`)) return;
        } catch {
            /* Navigation may replace the execution context. */
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error(`DOM wait timed out: ${expression}`);
};
const screenshot = async (name) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(output, name), Buffer.from(data, 'base64'));
};
try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
    });
    await send('Page.navigate', { url: 'http://127.0.0.1:5174/test/browser/calendar-preview.html?role=doctor' });
    await waitFor(`document.querySelectorAll('button[draggable="true"]').length > 0`);
    const desktop = await evaluate(
        `({ overflow: document.documentElement.scrollWidth > innerWidth, events: document.querySelectorAll('button[draggable="true"]').length, columns: document.querySelectorAll('[class*="dayColumn"]').length })`,
    );
    assert.equal(desktop.overflow, false, 'Desktop viewport must not overflow');
    assert.equal(desktop.columns, 7, 'Desktop displays a seven-day grid');
    await screenshot('calendar-desktop.png');
    await evaluate(`document.querySelector('button[draggable="true"]').click()`);
    await waitFor(`document.querySelector('[role="dialog"]')`);
    await waitFor(`(() => { const paper = document.querySelector('[class*="MuiDrawer-paper"]'); const rect = paper?.getBoundingClientRect(); return rect && rect.left >= 0 && rect.right <= innerWidth + 1; })()`);
    assert.ok(
        await evaluate(
            `document.querySelector('[role="dialog"]').textContent.includes('Lịch sử thay đổi') || document.querySelector('[role="dialog"]').textContent.includes('Change history')`,
        ),
    );
    await screenshot('calendar-details.png');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await waitFor(`(() => { const paper = document.querySelector('[class*="MuiDrawer-paper"]'); return paper && paper.getBoundingClientRect().right <= innerWidth + 1 && paper.clientWidth <= innerWidth; })()`);
    assert.ok(await evaluate(`(() => { const detail = document.querySelector('[role="dialog"]'); return detail.scrollWidth <= detail.clientWidth + 1; })()`), 'Appointment details fit the mobile drawer');
    await screenshot('calendar-details-mobile.png');
    await send('Page.navigate', { url: 'http://127.0.0.1:5174/test/browser/calendar-preview.html?role=patient' });
    await waitFor(`document.querySelectorAll('[class*="agendaItem"]').length > 0`);
    const mobile = await evaluate(
        `({ overflow: document.documentElement.scrollWidth > innerWidth, cards: document.querySelectorAll('[class*="agendaItem"]').length, grids: document.querySelectorAll('[class*="gridScroll"]').length, draggable: document.querySelectorAll('button[draggable="true"]').length })`,
    );
    assert.equal(mobile.overflow, false, 'Mobile viewport must not overflow');
    assert.equal(mobile.grids, 0, 'Mobile uses a daily agenda');
    assert.equal(mobile.draggable, 0, 'Patients cannot drag appointments');
    await screenshot('calendar-mobile.png');
    for (const role of ['doctor', 'patient']) {
        await send('Emulation.setDeviceMetricsOverride', {
            width: 1280,
            height: 1000,
            deviceScaleFactor: 1,
            mobile: false,
        });
        await send('Page.navigate', {
            url: `http://127.0.0.1:5174/test/browser/calendar-preview.html?role=${role}&integrated`,
        });
        await waitFor(`document.querySelectorAll('[class*="dayColumn"]').length === 7`);
        assert.equal(
            await evaluate('document.documentElement.scrollWidth > innerWidth'),
            false,
            `${role} profile must not overflow`,
        );
        assert.ok(
            await evaluate(
                `(() => { const grid = document.querySelector('[class*="gridScroll"]'); return grid.scrollWidth <= grid.clientWidth + 1; })()`,
            ),
            `${role} profile shows all seven days without horizontal scrolling`,
        );
        await screenshot(`calendar-profile-${role}.png`);
        await send('Emulation.setDeviceMetricsOverride', {
            width: 390,
            height: 844,
            deviceScaleFactor: 1,
            mobile: true,
        });
        await waitFor(`document.querySelectorAll('[class*="agendaItem"]').length > 0`);
        assert.equal(
            await evaluate('document.documentElement.scrollWidth > innerWidth'),
            false,
            `${role} mobile profile must not overflow`,
        );
        await screenshot(`calendar-profile-${role}-mobile.png`);
    }
    assert.deepEqual(exceptions, [], 'No uncaught browser exceptions');
    console.log(JSON.stringify({ desktop, mobile, screenshots: output, exceptions }));
} finally {
    await send('Page.close').catch(() => {});
    socket.close();
}
