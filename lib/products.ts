export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    options: {
        name: string;
        values: string[];
    }[];
}

export const products: Product[] = [
    {
        id: 'ugg-classic-mini',
        name: 'Cozy Classic Mini Boot',
        price: 89.99,
        description: 'The iconic boot that started it all. Featuring premium sheepskin and our signature cozy sole.',
        images: [
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop', // Placeholder
        ],
        options: [
            { name: 'Color', values: ['Chestnut', 'Black', 'Grey'] },
            { name: 'Size', values: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9'] }
        ]
    },
    {
        id: 'ugg-tasman',
        name: 'Tasman Slipper',
        price: 69.99,
        description: 'A slipper for all occasions. The Tasman features the same light, durable outsole as our Classic boot.',
        images: [
            'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=1000&auto=format&fit=crop' // Placeholder
        ],
        options: [
            { name: 'Color', values: ['Chestnut', 'Dark Green'] },
            { name: 'Size', values: ['US 5', 'US 6', 'US 7', 'US 8'] }
        ]
    }
];
