import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import Login from '../../components/Login.vue';
import { useAuthStore } from '../../stores/auth';

describe('Login.vue', () => {
    let authStore: ReturnType<typeof useAuthStore>;
    let pinia: any;

    beforeEach(() => {
        pinia = createTestingPinia({ stubActions: false });
        authStore = useAuthStore(pinia);
    });

    it('renders the "Sign in with Google" button in its default state', () => {
        authStore.isLoading = false;
        const wrapper = mount(Login, { global: { plugins: [pinia] } });
        const button = wrapper.find('button');

        expect(button.find('span').text()).toBe('Sign in with Google');
        expect(button.attributes('disabled')).toBeUndefined();
    });

    it('renders the "Authenticating..." text when loading', () => {
        authStore.isLoading = true;
        const wrapper = mount(Login, { global: { plugins: [pinia] } });
        const button = wrapper.find('button');

        expect(button.find('span.loading-text').text()).toBe('Authenticating...');
        expect(button.attributes('disabled')).toBeDefined();
    });

    it('calls the handleLogin action when the button is clicked', async () => {
        authStore.isLoading = false;
        const loginSpy = vi.spyOn(authStore, 'handleLogin');
        const wrapper = mount(Login, { global: { plugins: [pinia] } });
        await wrapper.find('button').trigger('click');
        expect(loginSpy).toHaveBeenCalledTimes(1);
    });
});