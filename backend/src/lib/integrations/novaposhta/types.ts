export interface NPCity {
    Ref: string;
    Description: string;
    DescriptionRu: string;
    SettlementType: string;
    Area: string;
    AreaDescription: string;
}

export interface NPWarehouse {
    Ref: string;
    SiteKey: string;
    Description: string;
    DescriptionRu: string;
    Number: string;
    CityRef: string;
    CityDescription: string;
    TypeOfWarehouse: string;
    PostalCodeUA: string;
    Phone: string;
}

export interface NPApiResponse<T> {
    success: boolean;
    data: T[];
    errors: string[];
    warnings: string[];
}
