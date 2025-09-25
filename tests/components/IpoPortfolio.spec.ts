import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';
import IpoPortfolio from '../../components/IpoPortfolio.vue';
import { usePortfolioStore, type Holding } from '../../stores/portfolio';

// --- Top-Level Mock for vue3-apexcharts ---
// This robustly replaces the component before any tests run, preventing rendering errors.
vi.mock('vue3-apexcharts', () => ({
    default: {
        name: 'VueApexCharts',
        template: '<div data-testid="vue-apex-charts-mock"></div>',
        props: ['type', 'height', 'options', 'series']
    }
}));

// --- Stubs for our own child components ---
const EditPortfolioModalStub = {
    template: '<div v-if="show" class="edit-modal-stub"></div>',
    props: ['show', 'holding']
};
const ConfirmModalStub = {
    template: '<div v-if="show" class="confirm-modal-stub"><button class="confirm-btn" @click="$emit(\'confirm\')"></button></div>',
    props: ['show', 'title', 'message', 'confirmText']
};

// --- Mock Data ---
const mockHolding: Holding = { id: 201, name: 'Holding One', unitsAllotted: 10, purchasePrice: 100, currentValue: 1250, investmentValue: 1000, sector: 'Tech', purchaseDate: '', createdAt: '' };
const mockSummary = { totalInvestment: 10000, totalCurrentValue: 12500, totalGainLoss: 2500, totalGainLossPercentage: 25 };
const mockChartData = { labels: ['Tech'], values: [12500] };

describe('IpoPortfolio.vue', () => {
    let portfolioStore: ReturnType<typeof usePortfolioStore>;
    let pinia: any;

    beforeEach(() => {
        pinia = createTestingPinia({ stubActions: false });
        portfolioStore = usePortfolioStore(pinia);

        // Reset store states before each test for isolation
        portfolioStore.isLoading = false;
        portfolioStore.error = null;
        portfolioStore.summary = null;
        portfolioStore.chartData = null;
        portfolioStore.holdings = [];

        // Clear all mocks
        vi.clearAllMocks();
    });

    it('calls fetchPortfolio on mount', () => {
        const fetchSpy = vi.spyOn(portfolioStore, 'fetchPortfolio').mockResolvedValue();
        mount(IpoPortfolio, { global: { plugins: [pinia] } });
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('displays loading, error, and empty states correctly', () => {
        // Loading State
        portfolioStore.isLoading = true;
        const wrapperLoading = mount(IpoPortfolio, { global: { plugins: [pinia] } });
        expect(wrapperLoading.text()).toContain('Loading Your Portfolio...');

        // Error State
        portfolioStore.isLoading = false;
        portfolioStore.error = 'Failed to load';
        const wrapperError = mount(IpoPortfolio, { global: { plugins: [pinia] } });
        expect(wrapperError.text()).toContain('Failed to load');

        // Empty State (no summary)
        portfolioStore.error = null;
        const wrapperEmpty = mount(IpoPortfolio, { global: { plugins: [pinia] } });
        expect(wrapperEmpty.text()).toContain("You haven't added any IPOs to your portfolio yet.");
    });

    it('renders KPIs and holdings when data is available', async () => {
        // Arrange
        portfolioStore.summary = mockSummary;
        portfolioStore.holdings = [mockHolding];

        // Act
        const wrapper = mount(IpoPortfolio, {
            global: { plugins: [pinia], stubs: { EditPortfolioModal: true, ConfirmModal: true } }
        });
        await nextTick();

        // Assert
        const kpiText = wrapper.find('.kpi-grid').text();
        expect(kpiText).toContain('Rs. 12.5k'); // Current Value
        expect(kpiText).toContain('Rs. 2.5k');  // Gain/Loss

        const holdingText = wrapper.find('.holding-item').text();
        expect(holdingText).toContain('Holding One');
    });

    it('opens the edit modal with correct data when edit button is clicked', async () => {
        // Arrange
        portfolioStore.summary = mockSummary;
        portfolioStore.holdings = [mockHolding];
        const wrapper = mount(IpoPortfolio, {
            global: { plugins: [pinia], stubs: { EditPortfolioModal: EditPortfolioModalStub, ConfirmModal: true } }
        });
        await nextTick();

        // Act
        await wrapper.find('.action-btn[title="Edit Holding"]').trigger('click');

        // Assert
        const modal = wrapper.findComponent(EditPortfolioModalStub);
        expect(modal.props('show')).toBe(true);
        expect(modal.props('holding')).toEqual(mockHolding);
    });

    it('calls updateHolding and emits toast when EditPortfolioModal emits "save"', async () => {
        // Arrange
        portfolioStore.summary = mockSummary;
        portfolioStore.holdings = [mockHolding];
        const updateSpy = vi.spyOn(portfolioStore, 'updateHolding').mockResolvedValue({ success: true, message: 'Updated!' });
        const wrapper = mount(IpoPortfolio, {
            global: { plugins: [pinia], stubs: { EditPortfolioModal: EditPortfolioModalStub, ConfirmModal: true } }
        });
        await nextTick();
        const editPayload = { ipoId: mockHolding.id, data: { units_allotted: 20 } };

        // Act
        await wrapper.find('.action-btn[title="Edit Holding"]').trigger('click');
        await wrapper.findComponent(EditPortfolioModalStub).vm.$emit('save', editPayload);

        // Assert
        expect(updateSpy).toHaveBeenCalledWith(editPayload.ipoId, editPayload.data);
        expect(wrapper.emitted('showToast')?.[0]).toEqual([{ message: 'Updated!', type: 'success' }]);
    });

    it('calls removeFromPortfolio when removal is confirmed via modal', async () => {
        // Arrange
        portfolioStore.summary = mockSummary;
        portfolioStore.holdings = [mockHolding];
        const removeSpy = vi.spyOn(portfolioStore, 'removeFromPortfolio').mockResolvedValue({ success: true, message: 'Removed!' });
        const wrapper = mount(IpoPortfolio, {
            global: { plugins: [pinia], stubs: { EditPortfolioModal: true, ConfirmModal: ConfirmModalStub } }
        });
        await nextTick();

        // Act
        await wrapper.find('.action-btn[title="Remove Holding"]').trigger('click');
        await wrapper.findComponent(ConfirmModalStub).vm.$emit('confirm');

        // Assert
        expect(removeSpy).toHaveBeenCalledWith(mockHolding.id);
        expect(wrapper.emitted('showToast')?.[0]).toEqual([{ message: 'Removed!', type: 'success' }]);
    });
});