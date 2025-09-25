import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IpoCard from '../../components/IpoCard.vue';
import type { Ipo } from '../../stores/ipos';

// We'll add `canAddToCalendar` and `canAddToPortfolio` which seem to be properties added by the store logic.
const createMockIpo = (overrides = {}): Ipo => ({
    id: 101,
    name: 'Vue Test Systems',
    type: 'IPO',
    ticker: 'VTS',
    startDate: '2024-10-01',
    endDate: '2024-10-05',
    minUnits: 10,
    pricePerUnit: 100,
    subscriptionStatus: 'Open',
    canAddToCalendar: true,
    canAddToPortfolio: true,
    ...overrides,
});

describe('IpoCard.vue', () => {
    it('renders IPO details correctly from props', () => {
        // Arrange
        const ipo = createMockIpo();
        const wrapper = mount(IpoCard, {
            props: {
                ipo,
                activeTab: 'thisWeek',
                index: 0,
                isLoading: false,
            },
        });

        // Assert
        const text = wrapper.text();
        expect(text).toContain('Vue Test Systems');
        expect(text).toContain('VTS · 10 Units @ Rs. 100');
        expect(text).toContain('IPO'); // The type badge
    });

    it('emits "addToCalendar" with the IPO payload when the calendar button is clicked', async () => {
        // Arrange
        const ipo = createMockIpo({ canAddToPortfolio: false });
        const wrapper = mount(IpoCard, {
            props: { ipo, activeTab: 'thisWeek', index: 0, isLoading: false },
        });

        // Act
        const calendarButton = wrapper.find('button'); // Since it's the only one
        await calendarButton.trigger('click');

        // Assert
        // Check if the 'addToCalendar' event was emitted
        expect(wrapper.emitted()).toHaveProperty('addToCalendar');
        // Check that it was emitted once
        expect(wrapper.emitted('addToCalendar')).toHaveLength(1);
        // Check that the payload of the first emission is the correct IPO object
        expect(wrapper.emitted('addToCalendar')?.[0]).toEqual([ipo]);
    });

    it('emits "addToPortfolio" with the IPO payload when the portfolio button is clicked', async () => {
        // Arrange
        const ipo = createMockIpo({ canAddToCalendar: false });
        const wrapper = mount(IpoCard, {
            props: { ipo, activeTab: 'thisWeek', index: 0, isLoading: false },
        });

        // Act
        const portfolioButton = wrapper.find('button');
        await portfolioButton.trigger('click');

        // Assert
        expect(wrapper.emitted()).toHaveProperty('addToPortfolio');
        expect(wrapper.emitted('addToPortfolio')).toHaveLength(1);
        expect(wrapper.emitted('addToPortfolio')?.[0]).toEqual([ipo]);
    });

    it('renders a spinner instead of action buttons when isLoading is true', () => {
        const ipo = createMockIpo();
        const wrapper = mount(IpoCard, {
            props: { ipo, activeTab: 'thisWeek', index: 0, isLoading: true },
        });

        expect(wrapper.find('.actions-spinner-container').exists()).toBe(true);
        expect(wrapper.find('.actions-overlay').exists()).toBe(false);
    });

    it('renders only the calendar button if canAddToPortfolio is false', () => {
        const ipo = createMockIpo({ canAddToPortfolio: false, canAddToCalendar: true });
        const wrapper = mount(IpoCard, {
            props: { ipo, activeTab: 'thisWeek', index: 0, isLoading: false },
        });

        const buttons = wrapper.findAll('button');
        expect(buttons).toHaveLength(1);
        expect(buttons[0].text()).toContain('Add to Calendar');
    });

    it('displays the correct status for a "pipeline" tab IPO', () => {
        const ipo = createMockIpo();
        const wrapper = mount(IpoCard, {
            props: { ipo, activeTab: 'pipeline', index: 0, isLoading: false },
        });

        expect(wrapper.find('.ipo-status').text()).toBe('Date: TBD');
        expect(wrapper.classes()).toContain('is-non-interactive');
    });

    it('displays the correct status for a "closed" IPO', () => {
        const ipo = createMockIpo({
            startDate: '2020-01-01',
            endDate: '2020-01-05'
        });
        const wrapper = mount(IpoCard, {
            props: { ipo, activeTab: 'thisWeek', index: 0, isLoading: false },
        });

        expect(wrapper.find('.ipo-status').text()).toBe('Closed');
        expect(wrapper.classes()).toContain('is-closed');
    });
});