
import React from 'react';
import { render } from '@testing-library/react';
import { IngredientList } from '../components/lists/IngredientList';
import { describe, it, expect, vi } from 'vitest';
import type { Ingredient } from '../types';

// Mock dependencies
vi.mock('../store/useStore', () => ({
    useStore: () => ({
        suppliers: [{ id: 's1', name: 'Supplier A' }],
        ingredients: [
            { id: '1', name: 'Tomato', costPerUnit: 2, supplierId: 's1' },
            { id: '2', name: 'Tomato', costPerUnit: 1.5, supplierId: 's2' }, // Cheaper duplicate
            { id: '3', name: 'Onion', costPerUnit: 1, supplierId: 's1' }
        ]
    })
}));

vi.mock('../components/printing/PrintService', () => ({
    printLabel: vi.fn(),
    formatLabelData: vi.fn()
}));

describe('IngredientList Performance Optimization', () => {
    const mockIngredients: Ingredient[] = [
        {
            id: '1',
            name: 'Tomato',
            unit: 'kg',
            costPerUnit: 2,
            yield: 1,
            allergens: [],
            stock: 10,
            minStock: 5,
            supplierId: 's1'
        },
        {
            id: '3',
            name: 'Onion',
            unit: 'kg',
            costPerUnit: 1,
            yield: 1,
            allergens: [],
            stock: 20,
            minStock: 5,
            supplierId: 's1'
        }
    ];

    const props = {
        ingredients: mockIngredients,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        sortConfig: { key: 'name', direction: 'asc' } as { key: keyof Ingredient | 'stock'; direction: 'asc' | 'desc' },
        onSort: vi.fn()
    };

    it('renders without crashing', () => {
        const { getByText } = render(<IngredientList {...props} />);
        expect(getByText('Tomato')).toBeDefined();
        expect(getByText('Onion')).toBeDefined();
    });

    // We can't easily test internal complexity (O(N*M)) here without rendering large lists and timing it,
    // which is flaky in unit tests.
    // But we can verify that the "price comparison" logic still finds the cheaper tomato.
    // The mock store returns a cheaper Tomato (id: 2).
    // The rendered component should show some indication of price comparison if logic is preserved.
    // Looking at the component, if there is a match, it shows an icon or similar.
    // However, the "Guerra de Precios" is in a tooltip / hidden by default or shown conditionally.
    // Actually, checking the code:
    // {getPriceComparison(ing) && ( <div ...> ... </div> )}
    // If getPriceComparison returns non-null, the div renders.

    it('detects price comparison matches', () => {
        const { container } = render(<IngredientList {...props} />);
        // Tomato has a match in the store (id: 2), so it should have the price comparison indicator.
        // We look for the "Swords" icon or the text "Guerra de Precios" (which might be in a tooltip).
        // The text "Guerra de Precios" is in the tooltip.

        // Let's check if the element with sword icon exists.
        // The Swords icon is from lucide-react. It usually renders an svg.
        // The component logic: if (matches.length === 0) return null;
        // Since we have a match for Tomato, it should render the div.

        // We can inspect the DOM for the text "Guerra de Precios" which is in the DOM but hidden?
        // Class: "absolute right-0 bottom-full mb-2 hidden group-hover/price:block z-50"

        expect(container.textContent).toContain('Guerra de Precios');
    });
});
