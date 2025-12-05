// Product type definitions for type safety across the application

export interface Product {
    id: string;
    cj_url: string;
    name: string;
    category: string;
    product_cost: number;
    shipping_cost: number;
    lastmile_fee: number;
    total_cost: number;
    min_selling_price: number;
    recommended_price: number;
    profit_per_sale: number;
    profit_margin_percent: number;
    processing_days_min: number;
    processing_days_max: number;
    delivery_days_min: number;
    delivery_days_max: number;
    total_days_max: number;
    us_warehouse: boolean;
    chinese_inventory: boolean;
    inventory_count: number;
    images: string[];
    notes: string;
    submitted_by: string;
    submitted_at: Date;
    validation_passed: boolean;
    rejection_reasons: string[];
    status: 'approved' | 'rejected' | 'review';
    ai_scores: AIScores | null;
    ai_overall_score: number | null;
    ai_recommendation: 'APPROVE' | 'REVIEW' | 'REJECT' | null;
    ai_explanation_en: string | null;
    ai_explanation_kh: string | null;
}

export interface AIScores {
    cozy: number;
    minimalist: number;
    home_relevance: number;
    quality: number;
    year_round: number;
}

export interface ProductFormData {
    cj_url: string;
    name: string;
    category: string;
    product_cost: number;
    shipping_cost: number;
    lastmile_fee: number;
    processing_days_min: number;
    processing_days_max: number;
    delivery_days_min: number;
    delivery_days_max: number;
    us_warehouse: boolean;
    chinese_inventory: boolean;
    inventory_count: number;
    images: string[];
    notes: string;
    submitted_by: string;
}

export interface ProductSubmitPayload extends ProductFormData {
    total_cost: number;
    min_selling_price: number;
    recommended_price: number;
    profit_per_sale: number;
    profit_margin_percent: number;
    total_days_max: number;
    validation_passed: boolean;
    rejection_reasons: string[];
    status: string;
    ai_scores: AIScores | null;
    ai_overall_score: number | null;
    ai_recommendation: string | null;
    ai_explanation_en: string | null;
    ai_explanation_kh: string | null;
}

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    type: 'exact' | 'similar' | null;
    existingProduct: {
        id: string;
        name: string;
        submitted_by: string;
        submitted_at: Date;
    } | null;
}

export interface DashboardStats {
    total: number;
    approved: number;
    rejected: number;
    review: number;
    recent: Product[];
}
