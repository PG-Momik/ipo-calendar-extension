import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TheHeader from '../../components/TheHeader.vue';
import { useAuthStore } from '../../stores/auth';

describe('TheHeader.vue', () => {
    let authStore: ReturnType<typeof useAuthStore>;
    let pinia: any;

    beforeEach(() => {
        pinia = createTestingPinia();
        authStore = useAuthStore(pinia);
    });

    it('shows the logout button in the dropdown when user is authenticated', async () => {
        // Arrange
        authStore.isAuthenticated = true;
        const wrapper = mount(TheHeader, { global: { plugins: [pinia] } });

        // Act: Open the dropdown
        await wrapper.find('.settings-btn').trigger('click');

        // Assert
        const dropdown = wrapper.find('.settings-dropdown');
        expect(dropdown.exists()).toBe(true);
        expect(dropdown.text()).toContain('Logout');
    });

    it('emits "viewChange" with "Login" when a protected link is clicked while logged out', async () => {
        // Arrange
        authStore.isAuthenticated = false;
        const wrapper = mount(TheHeader, { global: { plugins: [pinia] } });

        // Act
        await wrapper.find('.settings-btn').trigger('click');

        // Find button by its text content
        const calendarButton = wrapper.findAll('.dropdown-item').find(w => w.text().includes('Calendar'));
        await calendarButton.trigger('click');

        // Assert
        expect(wrapper.emitted('viewChange')?.[0]).toEqual(['Login']);
        expect(wrapper.emitted('showToast')).toBeDefined();
    });

    it('emits "viewChange" with "Calendar" when the link is clicked while logged in', async () => {
        // Arrange
        authStore.isAuthenticated = true;
        const wrapper = mount(TheHeader, { global: { plugins: [pinia] } });

        // Act
        await wrapper.find('.settings-btn').trigger('click');
        const calendarButton = wrapper.findAll('.dropdown-item').find(w => w.text().includes('Calendar'));
        await calendarButton.trigger('click');

        // Assert
        expect(wrapper.emitted('viewChange')?.[0]).toEqual(['Calendar']);
        expect(wrapper.emitted('showToast')).toBeUndefined();
    });
});