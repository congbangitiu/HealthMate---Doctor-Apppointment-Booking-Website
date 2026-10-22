import { useState } from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, configure, getConfig, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../../../../config', () => ({ BASE_URL: 'http://localhost:5000/api/v1', token: 'unit-token' }));
vi.mock('react-toastify', () => ({ toast: mocks }));
vi.mock('react-spinners/SyncLoader', () => ({ default: () => <span role="status">Saving</span> }));
vi.mock('../../../components/SignatureConfirmation/SignatureConfirmation', () => ({ default: () => null }));
vi.mock('../../../hooks/useResponsive', () => ({ default: () => ({ isTabletOrMobile: false }) }));
vi.mock('../../../utils/translation/translateDosageForm', () => ({ default: (value) => value }));
vi.mock('../../../utils/translation/translateMealRelation', () => ({ default: (value) => value }));
vi.mock('../../../utils/translation/translateTimeOfDay', () => ({ default: (value) => value }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key === 'notes' ? ['Follow the instructions'] : key }) }));
// The source delete control is a div with an icon; label the icon in this test only.
vi.mock('react-icons/fa', () => ({ FaRegTrashAlt: () => <svg role="img" aria-label="Remove medication" /> }));
import PrescriptionEdit from './PrescriptionEdit';

const base = 'http://localhost:5000/api/v1';
const csv = 'Name,Strength,Dosage Form\nParacetamol,500 mg,Tablet\nAmoxicillin,250 mg,Capsule\nIncomplete,,Tablet\n';
const medicine = (name = 'Existing medicine') => ({
    name, dosage: { timesPerDay: 2, quantityPerTime: 1, totalUnits: 10,
        timeOfDay: ['Morning'], dosageForm: 'Tablet', mealRelation: 'After meal' },
});
const jsonResponse = (body = {}, ok = true) => ({ ok, json: vi.fn().mockResolvedValue(body) });
const deferred = () => {
    let resolve;
    const promise = new Promise((finish) => { resolve = finish; });
    return { promise, resolve };
};
let apiFetch;
let fetchMock;
let user;

// Use async act instead of RTL's real zero-delay wait under Vitest fake timers.
const originalAsyncWrapper = getConfig().asyncWrapper;
beforeAll(() => configure({ asyncWrapper: async (action) => {
    let result;
    await act(async () => { result = await action(); });
    return result;
} }));
afterAll(() => configure({ asyncWrapper: originalAsyncWrapper }));

beforeEach(() => {
    vi.useFakeTimers();
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    apiFetch = vi.fn().mockResolvedValue(jsonResponse());
    // Real PapaParse reads a tiny fixture instead of fetching the production CSV.
    fetchMock = vi.fn((url, options) => url === '/mock-data/Medicine.csv'
        ? Promise.resolve({ text: vi.fn().mockResolvedValue(csv) }) : apiFetch(url, options));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('scrollTo', vi.fn());
    mocks.success.mockClear();
    mocks.error.mockClear();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0, y: 0, top: 0, left: 0, width: 200, height: 40, right: 200, bottom: 40, toJSON: () => ({}),
    });
});

async function renderEditor(overrides = {}) {
    const options = {
        appointment: { user: { fullname: 'Test Patient', gender: 'female', dateOfBirth: '2000-01-01', phone: '901234567', address: 'Test address' } },
        setAppointment: vi.fn(), diseaseName: 'Test condition', setDiseaseName: vi.fn(),
        doctorAdvice: 'Test advice', setDoctorAdvice: vi.fn(), medications: [medicine()],
        id: 'booking-id', createdTime: undefined, isSigned: false, setIsSigned: vi.fn(), ...overrides,
    };
    const changes = vi.fn();
    let currentMedications;
    function Editor() {
        const [medications, setMedications] = useState(options.medications);
        currentMedications = medications;
        return <PrescriptionEdit {...options} medications={medications} setMedications={(value) => {
            changes(value);
            setMedications(value);
        }} />;
    }
    let view;
    await act(async () => { view = render(<Editor />); });
    return { ...view, options, changes, getMedications: () => currentMedications };
}

const medicineInput = (index = 0) => screen.getAllByRole('combobox').filter((element) => element.tagName === 'INPUT')[index];
const row = (index = 0) => medicineInput(index).closest('[class*="_medication_"]');
const dosageForm = (index = 0) => row(index).querySelector('input[type="text"]:not([role="combobox"])');
async function chooseMedicine(index = 0) {
    await user.clear(medicineInput(index));
    await user.type(medicineInput(index), 'Parac');
    await user.click(screen.getByRole('option', { name: 'Paracetamol 500 mg' }));
}

describe('PrescriptionEdit', () => {
    it('FE-P01: selects a CSV medicine with its full name and read-only dosage form', async () => {
        const view = await renderEditor();
        await chooseMedicine();
        expect(view.getMedications()[0]).toMatchObject({ name: 'Paracetamol 500 mg', dosage: { dosageForm: 'Tablet' } });
        expect(dosageForm()).toHaveValue('Tablet');
        expect(dosageForm()).toHaveAttribute('readonly');
        expect(fetchMock).toHaveBeenCalledWith('/mock-data/Medicine.csv');
    });

    it('FE-P02: permits a custom medicine and its dosage form to be edited', async () => {
        const view = await renderEditor();
        await user.clear(medicineInput());
        await user.type(medicineInput(), 'Custom medicine');
        expect(view.getMedications()[0].name).toBe('Custom medicine');
        expect(dosageForm()).not.toHaveAttribute('readonly');
        await user.clear(dosageForm());
        await user.type(dosageForm(), 'Custom form');
        expect(view.getMedications()[0].dosage.dosageForm).toBe('Custom form');
        await chooseMedicine();
        expect(dosageForm()).toHaveAttribute('readonly');
        expect(view.getMedications()[0].dosage.dosageForm).toBe('Tablet');
    });

    it('FE-P03: changes only the second medicine dosage field', async () => {
        const medications = [medicine('First'), medicine('Second'), medicine('Third')];
        const snapshot = structuredClone(medications);
        const view = await renderEditor({ medications });
        const input = within(row(1)).getAllByRole('spinbutton')[0];
        await user.clear(input);
        await user.type(input, '4');
        expect(view.getMedications()[1].dosage.quantityPerTime).toBe('4');
        expect(view.getMedications()[0]).toEqual(snapshot[0]);
        expect(view.getMedications()[2]).toEqual(snapshot[2]);
        expect(view.getMedications()[1].dosage.timesPerDay).toBe(snapshot[1].dosage.timesPerDay);
    });

    it.each(['name', 'dosage'])('FE-P04: preserves the previous state objects when changing %s', async (field) => {
        const medications = [medicine()];
        const previous = structuredClone(medications);
        const view = await renderEditor({ medications });
        if (field === 'name') await user.type(medicineInput(), ' changed');
        else {
            const input = within(row()).getAllByRole('spinbutton')[0];
            await user.clear(input);
            await user.type(input, '3');
        }
        expect(medications).toEqual(previous);
        expect(view.getMedications()).not.toBe(medications);
        expect(view.getMedications()[0]).not.toBe(medications[0]);
        if (field === 'dosage') expect(view.getMedications()[0].dosage).not.toBe(medications[0].dosage);
    });

    it('FE-P05: adds a medicine with the default dosage and a non-custom form', async () => {
        const view = await renderEditor({ medications: [] });
        await user.click(screen.getByRole('button', { name: 'button.add' }));
        expect(view.getMedications()).toEqual([{
            name: '', dosage: { timesPerDay: 0, quantityPerTime: 0, totalUnits: 0,
                timeOfDay: ['Morning'], dosageForm: '', mealRelation: 'After meal' },
        }]);
        expect(dosageForm()).toHaveAttribute('readonly');
    });

    it('FE-P06: removes a middle medicine without shifting custom flags onto the wrong row', async () => {
        const view = await renderEditor({ medications: [medicine('First'), medicine('Second'), medicine('Third')] });
        // Establish a real catalog selection before checking its read-only flag.
        await chooseMedicine(0);
        expect(dosageForm(0)).toHaveAttribute('readonly');
        await user.clear(medicineInput(2));
        await user.type(medicineInput(2), 'Third custom');
        await user.click(screen.getAllByLabelText('Remove medication')[1]);
        expect(view.getMedications().map(({ name }) => name)).toEqual(['Paracetamol 500 mg', 'Third custom']);
        expect(dosageForm(0)).toHaveAttribute('readonly');
        expect(dosageForm(1)).not.toHaveAttribute('readonly');
    });

    it.each([
        [undefined, 'POST', '/prescriptions', 'create', 'Prescription saved successfully!'],
        ['2026-10-22T10:00:00Z', 'PUT', '/prescriptions/booking-id', 'update', 'Prescription updated successfully!'],
    ])('FE-P07/FE-P08: uses %s to choose the correct save request', async (createdTime, method, path, action, message) => {
        const view = await renderEditor({ createdTime });
        await user.click(screen.getByRole('button', { name: 'button.save' }));
        expect(apiFetch).toHaveBeenNthCalledWith(1, `${base}${path}`, {
            method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer unit-token' },
            body: JSON.stringify({ appointment: 'booking-id', diseaseName: 'Test condition', medications: view.options.medications,
                doctorAdvice: 'Test advice', action, isSigned: false }),
        });
        expect(apiFetch).toHaveBeenCalledTimes(2);
        expect(mocks.success).toHaveBeenCalledWith(message);
        expect(mocks.error).not.toHaveBeenCalled();
    });

    it('FE-P09: waits for prescription saving before updating booking status to done', async () => {
        const save = deferred();
        const status = deferred();
        apiFetch.mockReturnValueOnce(save.promise).mockReturnValueOnce(status.promise);
        await renderEditor();
        const timer = vi.spyOn(globalThis, 'setTimeout');
        await user.click(screen.getByRole('button', { name: 'button.save' }));
        expect(apiFetch).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('status')).toBeInTheDocument();
        await act(async () => { save.resolve(jsonResponse()); await save.promise; });
        expect(apiFetch).toHaveBeenNthCalledWith(2, `${base}/bookings/booking-id/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer unit-token' },
            body: JSON.stringify({ status: 'done' }),
        });
        expect(mocks.success).not.toHaveBeenCalledWith('Appointment status updated successfully!');
        expect(timer).not.toHaveBeenCalledWith(expect.any(Function), 2000);
        await act(async () => { status.resolve(jsonResponse()); await status.promise; });
        expect(mocks.success).toHaveBeenCalledWith('Appointment status updated successfully!');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(timer).toHaveBeenCalledWith(expect.any(Function), 2000);
    });

    it.each(['HTTP', 'network', 'JSON'])('FE-P10: stops without updating booking after a save %s failure', async (kind) => {
        if (kind === 'network') apiFetch.mockRejectedValueOnce(new Error('Network unavailable'));
        else if (kind === 'JSON') apiFetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockRejectedValue(new Error('Invalid JSON')) });
        else apiFetch.mockResolvedValueOnce(jsonResponse({ message: 'Save rejected' }, false));
        await renderEditor();
        await user.click(screen.getByRole('button', { name: 'button.save' }));
        expect(apiFetch).toHaveBeenCalledTimes(1);
        expect(mocks.error).toHaveBeenCalledWith(kind === 'HTTP' ? 'Save rejected' : kind === 'network' ? 'Network unavailable' : 'Invalid JSON');
        expect(mocks.success).not.toHaveBeenCalled();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'button.save' })).toBeInTheDocument();
    });

    it('FE-P11: reports status failure after saving without claiming booking completion or repeating the save', async () => {
        apiFetch.mockResolvedValueOnce(jsonResponse()).mockResolvedValueOnce(jsonResponse({ message: 'Status rejected' }, false));
        await renderEditor();
        await user.click(screen.getByRole('button', { name: 'button.save' }));
        expect(apiFetch).toHaveBeenCalledTimes(2);
        expect(mocks.error).toHaveBeenCalledWith('Status rejected');
        expect(mocks.success).not.toHaveBeenCalledWith('Appointment status updated successfully!');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it.each(['save HTTP', 'save network', 'status HTTP'])(
        'FE-P12: retains the form without scheduling reload after %s failure', async (kind) => {
            if (kind === 'save network') apiFetch.mockRejectedValueOnce(new Error('Request failed'));
            else if (kind === 'save HTTP') apiFetch.mockResolvedValueOnce(jsonResponse({ message: 'Request failed' }, false));
            else apiFetch.mockResolvedValueOnce(jsonResponse()).mockResolvedValueOnce(jsonResponse({ message: 'Request failed' }, false));
            await renderEditor();
            const timer = vi.spyOn(globalThis, 'setTimeout');
            await user.click(screen.getByRole('button', { name: 'button.save' }));
            expect(mocks.error).toHaveBeenCalledWith('Request failed');
            expect(screen.getByDisplayValue('Test condition')).toBeInTheDocument();
            // Inspect scheduling without redefining location or executing reload in jsdom.
            expect(timer).not.toHaveBeenCalledWith(expect.any(Function), 2000);
        },
    );

    it('FE-P13: clears the medicine name and dosage form together without mutating the previous state', async () => {
        const original = [medicine()];
        const snapshot = structuredClone(original);
        const view = await renderEditor({ medications: original });
        await user.clear(medicineInput());
        expect(view.getMedications()[0]).toMatchObject({ name: '', dosage: { dosageForm: '', quantityPerTime: 1 } });
        expect(dosageForm()).not.toHaveAttribute('readonly');
        expect(original).toEqual(snapshot);
    });

    it('FE-P14: selects a catalog medicine without mutating its previous name or dosage', async () => {
        const original = [medicine()];
        const snapshot = structuredClone(original);
        const view = await renderEditor({ medications: original });
        await chooseMedicine();
        expect(view.getMedications()[0]).toMatchObject({ name: 'Paracetamol 500 mg', dosage: { dosageForm: 'Tablet' } });
        expect(original).toEqual(snapshot);
        expect(view.getMedications()[0]).not.toBe(original[0]);
        expect(view.getMedications()[0].dosage).not.toBe(original[0].dosage);
        expect(dosageForm()).toHaveAttribute('readonly');
    });

    it('FE-P15: permits retry with the same form data after saving is rejected', async () => {
        apiFetch.mockResolvedValueOnce(jsonResponse({ message: 'Save rejected' }, false))
            .mockResolvedValueOnce(jsonResponse()).mockResolvedValueOnce(jsonResponse());
        await renderEditor();
        const timer = vi.spyOn(globalThis, 'setTimeout');
        await user.click(screen.getByRole('button', { name: 'button.save' }));
        expect(mocks.error).toHaveBeenCalledWith('Save rejected');
        expect(timer).not.toHaveBeenCalledWith(expect.any(Function), 2000);
        const failedBody = apiFetch.mock.calls[0][1].body;
        await user.click(screen.getByRole('button', { name: 'button.save' }));
        expect(apiFetch).toHaveBeenCalledTimes(3);
        expect(apiFetch.mock.calls[1][1].body).toBe(failedBody);
        expect(mocks.success).toHaveBeenCalledWith('Appointment status updated successfully!');
        expect(timer).toHaveBeenCalledWith(expect.any(Function), 2000);
    });

    it.todo('FE-P12: verifies real reload after success and preservation of unsaved form data after failure in a browser');
});
