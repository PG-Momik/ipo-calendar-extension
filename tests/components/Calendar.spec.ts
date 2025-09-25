import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';
import Calendar from '../../components/Calendar.vue';
import { useCalendarStore } from '../../stores/calendar';
import { useAuthStore } from '../../stores/auth';
import type { Ipo } from '../../stores/ipos';

// Mock v-calendar at the module level to prevent any rendering issues
vi.mock('v-calendar', () => ({
    Calendar: {
        name: 'VCalendar',
        template: '<div data-testid="v-calendar-mock"></div>',
        props: ['attributes', 'borderless', 'transparent', 'is-dark', 'expanded', 'title-position']
    }
}));

// Mock dayjs
vi.mock('dayjs', () => {
    const mockDayjs = (date?: any) => ({
        format: vi.fn((format: string) => {
            if (format === 'MMM D') return 'Mar 1';
            if (format === 'D') return '5';
            return 'Mar 1';
        })
    });
    return {
        default: mockDayjs
    };
});

// Stub our own ConfirmModal
const ConfirmModalStub = {
    template: '<div v-if="show" class="confirm-modal-stub"><button class="confirm-btn" @click="$emit(\'confirm\')"></button></div>',
    props: ['show', 'title', 'message', 'confirmText']
};

const mockTrackedIpos: Ipo[] = [
    { id: 301, name: 'Tracked IPO 1', startDate: '2024-03-01', endDate: '2024-03-05', type: 'IPO', ticker: 'T1', minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Open' },
    { id: 302, name: 'Tracked IPO 2', startDate: '2024-04-01', endDate: '2024-04-05', type: 'IPO', ticker: 'T2', minUnits: 20, pricePerUnit: 200, subscriptionStatus: 'Open' },
];

describe('Calendar.vue', () => {
    let calendarStore: ReturnType<typeof useCalendarStore>;
    let authStore: ReturnType<typeof useAuthStore>;
    let pinia: any;

    beforeEach(() => {
        pinia = createTestingPinia({ stubActions: false });
        calendarStore = useCalendarStore(pinia);
        authStore = useAuthStore(pinia);

        // Reset store states
        calendarStore.isLoading = false;
        calendarStore.error = null;
        calendarStore.trackedIpos = [];

        // Clear all mocks
        vi.clearAllMocks();
    });

    it('fetches tracked IPOs on mount if user is already authenticated', () => {
        // Arrange
        authStore.isAuthenticated = true;
        const fetchSpy = vi.spyOn(calendarStore, 'fetchTrackedIpos').mockResolvedValue();

        // Act
        mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        // Assert
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('fetches tracked IPOs only after the user becomes authenticated', async () => {
        // Arrange
        authStore.isAuthenticated = false;
        const fetchSpy = vi.spyOn(calendarStore, 'fetchTrackedIpos').mockResolvedValue();

        mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        // Assert: should not have been called yet
        expect(fetchSpy).not.toHaveBeenCalled();

        // Act: Simulate the user logging in
        authStore.isAuthenticated = true;
        await nextTick(); // Wait for Vue's reactivity system

        // Assert: now it should have been called
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('displays loading state when store is loading', () => {
        // Arrange
        calendarStore.isLoading = true;

        // Act
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        // Assert
        expect(wrapper.text()).toContain('Loading Your Calendar...');
    });

    it('displays error state when there is an error', () => {
        // Arrange
        calendarStore.error = 'Failed to load calendar';

        // Act
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        // Assert
        expect(wrapper.text()).toContain('Could not load data.');
    });

    it('displays empty state when no IPOs are tracked', () => {
        // Arrange
        calendarStore.trackedIpos = [];

        // Act
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        // Assert
        expect(wrapper.text()).toContain('No IPOs added to your calendar yet.');
    });

    it('renders a list of tracked IPOs from the store', async () => {
        // Arrange
        calendarStore.trackedIpos = mockTrackedIpos;

        // Act
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        await nextTick();

        // Assert
        const items = wrapper.findAll('.tracked-item');
        expect(items.length).toBe(2);
        expect(items[0].text()).toContain('Tracked IPO 1');
        expect(items[1].text()).toContain('Tracked IPO 2');
    });

    it('opens the confirmation modal when a remove button is clicked', async () => {
        // Arrange
        calendarStore.trackedIpos = [mockTrackedIpos[0]];
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        await nextTick();

        // Act
        await wrapper.find('.remove-btn').trigger('click');

        // Assert
        const modal = wrapper.findComponent(ConfirmModalStub);
        expect(modal.props('show')).toBe(true);
    });

    it('calls removeFromCalendar action when removal is confirmed', async () => {
        // Arrange
        calendarStore.trackedIpos = [mockTrackedIpos[0]];
        const removeSpy = vi.spyOn(calendarStore, 'removeFromCalendar').mockResolvedValue();
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        await nextTick();

        // Act
        await wrapper.find('.remove-btn').trigger('click');
        await wrapper.findComponent(ConfirmModalStub).vm.$emit('confirm');

        // Assert
        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledWith(mockTrackedIpos[0].id);
    });

    it('shows a spinner on the button of the IPO being removed', async () => {
        // Arrange
        calendarStore.trackedIpos = [mockTrackedIpos[0]];
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        await nextTick();

        // Create a promise that we can control
        let resolveRemove: () => void;
        const removePromise = new Promise<void>(resolve => {
            resolveRemove = resolve;
        });
        vi.spyOn(calendarStore, 'removeFromCalendar').mockReturnValue(removePromise);

        // Act
        await wrapper.find('.remove-btn').trigger('click');
        await wrapper.findComponent(ConfirmModalStub).vm.$emit('confirm');
        await nextTick();

        // Assert: The button should now be disabled and contain a spinner
        const button = wrapper.find('.remove-btn');
        expect(button.attributes('disabled')).toBeDefined();
        expect(button.find('.spinner-small').exists()).toBe(true);

        // Clean up - resolve the promise
        resolveRemove!();
        await nextTick();
    });

    it('disables remove button during removal operation', async () => {
        // Arrange
        calendarStore.trackedIpos = mockTrackedIpos;
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        await nextTick();

        // Create a controlled promise for the first IPO removal
        let resolveRemove: () => void;
        const removePromise = new Promise<void>(resolve => {
            resolveRemove = resolve;
        });
        vi.spyOn(calendarStore, 'removeFromCalendar').mockReturnValue(removePromise);

        // Act - start removing the first IPO
        await wrapper.find('.remove-btn').trigger('click');
        await wrapper.findComponent(ConfirmModalStub).vm.$emit('confirm');
        await nextTick();

        // Try to click the first button again - should be disabled
        const firstButton = wrapper.find('.remove-btn');
        expect(firstButton.attributes('disabled')).toBeDefined();

        // Clean up
        resolveRemove!();
        await nextTick();
    });

    it('generates correct calendar attributes for tracked IPOs', async () => {
        // Arrange
        calendarStore.trackedIpos = mockTrackedIpos;

        // Act
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        await nextTick();

        // Assert that VCalendar receives the correct attributes
        const vCalendar = wrapper.find('[data-testid="v-calendar-mock"]');
        expect(vCalendar.exists()).toBe(true);

        // We can test the computed property logic by accessing the component's internal state
        const vm = wrapper.vm as any;
        expect(vm.calendarAttributes).toHaveLength(2);
        expect(vm.calendarAttributes[0].key).toBe(301);
        expect(vm.calendarAttributes[1].key).toBe(302);
    });

    it('closes modal when cancel is clicked', async () => {
        // Arrange
        calendarStore.trackedIpos = [mockTrackedIpos[0]];
        const wrapper = mount(Calendar, {
            global: {
                plugins: [pinia],
                stubs: {
                    ConfirmModal: ConfirmModalStub
                }
            }
        });

        await nextTick();

        // Act
        await wrapper.find('.remove-btn').trigger('click');
        let modal = wrapper.findComponent(ConfirmModalStub);
        expect(modal.props('show')).toBe(true);

        await modal.vm.$emit('cancel');
        await nextTick();

        // Assert
        modal = wrapper.findComponent(ConfirmModalStub);
        expect(modal.props('show')).toBe(false);
    });
});