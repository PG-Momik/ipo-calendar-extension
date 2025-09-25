import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import IpoList from '../../components/IpoList.vue';
import { useIpoStore } from '../../stores/ipos';
import { useAuthStore } from '../../stores/auth';
import type { Ipo } from '../../stores/ipos';

// Stubs for child components to isolate the IpoList component
const IpoCardStub = {
    template: '<div class="ipo-card-stub"></div>',
    props: ['ipo', 'activeTab', 'index', 'isLoading']
};
const ConfirmModalStub = {
    template: '<div v-if="show" class="confirm-modal-stub"><slot name="extra-options" /><button class="confirm" @click="$emit(\'confirm\')"></button></div>',
    props: ['show']
};

const mockIpo: Ipo = { id: 101, name: 'IPO One', type: 'IPO', ticker: 'ONE', startDate: '2024-01-01', endDate: '2024-01-05', minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Open' };

describe('IpoList.vue', () => {
    let ipoStore: ReturnType<typeof useIpoStore>;
    let authStore: ReturnType<typeof useAuthStore>;
    let pinia: any;

    beforeEach(() => {
        pinia = createTestingPinia({ stubActions: false });
        ipoStore = useIpoStore(pinia);
        authStore = useAuthStore(pinia);
    });

    it('displays the loading bar when the store is loading', () => {
        ipoStore.isLoading = true;
        const wrapper = mount(IpoList, { global: { plugins: [pinia] } });
        expect(wrapper.find('.loading-bar-container').exists()).toBe(true);
    });

    it('renders a list of IpoCard components when data is available', () => {
        ipoStore.ipos = [mockIpo];
        const wrapper = mount(IpoList, {
            global: { plugins: [pinia], stubs: { IpoCard: IpoCardStub, ConfirmModal: true } }
        });
        expect(wrapper.findAllComponents(IpoCardStub).length).toBe(1);
    });

    it('opens the calendar modal when an IpoCard emits "addToCalendar" for an authenticated user', async () => {
        // Arrange
        authStore.isAuthenticated = true;
        ipoStore.ipos = [mockIpo];
        const wrapper = mount(IpoList, {
            global: { plugins: [pinia], stubs: { IpoCard: IpoCardStub, ConfirmModal: ConfirmModalStub } }
        });

        // Act
        await wrapper.findComponent(IpoCardStub).vm.$emit('addToCalendar', mockIpo);

        // Assert
        const modal = wrapper.findComponent(ConfirmModalStub);
        expect(modal.props('show')).toBe(true);
    });

    it('emits a toast and viewChange when "addToCalendar" is emitted for an unauthenticated user', async () => {
        // Arrange
        authStore.isAuthenticated = false;
        ipoStore.ipos = [mockIpo];
        const wrapper = mount(IpoList, {
            global: { plugins: [pinia], stubs: { IpoCard: IpoCardStub, ConfirmModal: true } }
        });

        // Act
        await wrapper.findComponent(IpoCardStub).vm.$emit('addToCalendar', mockIpo);

        // Assert
        expect(wrapper.emitted('showToast')?.[0]).toEqual([{ message: 'Login to use this feature.', type: 'warning' }]);
        expect(wrapper.emitted('viewChange')?.[0]).toEqual(['Login']);
    });

    it('calls the store action with google event preference when calendar modal is confirmed', async () => {
        // Arrange
        authStore.isAuthenticated = true;
        authStore.token = 'mock-token';
        ipoStore.ipos = [mockIpo];
        const addToCalendarSpy = vi.spyOn(ipoStore, 'addToCalendar').mockResolvedValue({ status: 'success', message: 'Added!' });
        const wrapper = mount(IpoList, {
            global: { plugins: [pinia], stubs: { IpoCard: IpoCardStub, ConfirmModal: ConfirmModalStub } }
        });

        // Act: Open the modal, check the box, and confirm
        await wrapper.findComponent(IpoCardStub).vm.$emit('addToCalendar', mockIpo);
        await wrapper.find('#google-event-checkbox').setValue(true);
        await wrapper.find('.confirm-modal-stub .confirm').trigger('click');

        // Assert
        expect(addToCalendarSpy).toHaveBeenCalledWith(mockIpo.id, 'mock-token', true);
        expect(wrapper.emitted('showToast')).toBeDefined();
    });
});