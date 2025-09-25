import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import Preferences from '../../components/Preferences.vue';
import { usePreferenceStore } from '../../stores/preferences';
import { useAuthStore } from '../../stores/auth';

describe('Preferences.vue', () => {
    let preferenceStore: ReturnType<typeof usePreferenceStore>;
    let authStore: ReturnType<typeof useAuthStore>;
    let pinia: any;

    beforeEach(() => {
        pinia = createTestingPinia({ stubActions: false });
        preferenceStore = usePreferenceStore(pinia);
        authStore = useAuthStore(pinia);

        // Set up the store options
        preferenceStore.options = {
            ipoTypes: ['IPO', 'FPO'],
            sectors: ['Tech', 'Health'],
            shareTypes: ['ordinary']
        };

        // Clear loading and error states
        preferenceStore.isLoading = false;
        preferenceStore.error = null;
    });

    it('displays a loading message when the store is loading', () => {
        preferenceStore.isLoading = true;
        const wrapper = mount(Preferences, { global: { plugins: [pinia] } });
        expect(wrapper.text()).toContain('Loading Preferences...');
    });

    it('shows "Sign In to Update Preferences" button for guests', () => {
        // Set up authenticated state
        authStore.isAuthenticated = false;

        // Set up preferences data so the component renders the form
        preferenceStore.current = {
            visible_ipo_types: ['IPO'],
            visible_sectors: ['Tech'],
            visible_share_types: ['ordinary']
        };

        const wrapper = mount(Preferences, { global: { plugins: [pinia] } });

        const button = wrapper.find('button');
        expect(button.exists()).toBe(true);
        expect(button.text()).toBe('Sign In to Update Preferences');
    });

    it('shows "Update Preferences" button for authenticated users', () => {
        // Set up authenticated state
        authStore.isAuthenticated = true;

        // Set up preferences data so the component renders the form
        preferenceStore.current = {
            visible_ipo_types: ['IPO'],
            visible_sectors: ['Tech'],
            visible_share_types: ['ordinary']
        };

        const wrapper = mount(Preferences, { global: { plugins: [pinia] } });

        const button = wrapper.find('button');
        expect(button.exists()).toBe(true);
        expect(button.text()).toBe('Update Preferences');
    });

    it('displays error message when there is an error', () => {
        preferenceStore.isLoading = false;
        preferenceStore.error = 'Failed to load preferences';

        const wrapper = mount(Preferences, { global: { plugins: [pinia] } });
        expect(wrapper.text()).toContain('Failed to load preferences');
    });

    it('renders preference sections when data is available', () => {
        authStore.isAuthenticated = true;
        preferenceStore.current = {
            visible_ipo_types: ['IPO'],
            visible_sectors: ['Tech'],
            visible_share_types: ['ordinary']
        };

        const wrapper = mount(Preferences, { global: { plugins: [pinia] } });

        expect(wrapper.text()).toContain('Issue Types');
        expect(wrapper.text()).toContain('Sectors');
        expect(wrapper.text()).toContain('Share Types');
    });

    it('emits viewChange event when unauthenticated user tries to save', async () => {
        authStore.isAuthenticated = false;
        preferenceStore.current = {
            visible_ipo_types: ['IPO'],
            visible_sectors: ['Tech'],
            visible_share_types: ['ordinary']
        };

        const wrapper = mount(Preferences, { global: { plugins: [pinia] } });

        const button = wrapper.find('button');
        await button.trigger('click');

        expect(wrapper.emitted('viewChange')).toBeTruthy();
        expect(wrapper.emitted('viewChange')?.[0]).toEqual(['Login']);
    });

    it('calls savePreferences when authenticated user saves', async () => {
        authStore.isAuthenticated = true;
        preferenceStore.current = {
            visible_ipo_types: ['IPO'],
            visible_sectors: ['Tech'],
            visible_share_types: ['ordinary']
        };

        // Mock the savePreferences method
        const savePreferencesSpy = vi.fn().mockResolvedValue({
            success: true,
            message: 'Preferences saved successfully'
        });
        preferenceStore.savePreferences = savePreferencesSpy;

        const wrapper = mount(Preferences, { global: { plugins: [pinia] } });

        const button = wrapper.find('button');
        await button.trigger('click');

        expect(savePreferencesSpy).toHaveBeenCalled();
        expect(wrapper.emitted('showToast')).toBeTruthy();
    });
});