export declare const toolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            featuredImage: {
                type: string;
                description: string;
            };
            slug?: undefined;
            publishDate?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            draftSlug?: undefined;
            status?: undefined;
            id?: undefined;
            type?: undefined;
            content?: undefined;
            selectors?: undefined;
            color?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            slug: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            featuredImage: {
                type: string;
                description: string;
            };
            publishDate?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            draftSlug?: undefined;
            status?: undefined;
            id?: undefined;
            type?: undefined;
            content?: undefined;
            selectors?: undefined;
            color?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            slug: {
                type: string;
                description: string;
            };
            title?: undefined;
            summary?: undefined;
            body?: undefined;
            tags?: undefined;
            featuredImage?: undefined;
            publishDate?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            draftSlug?: undefined;
            status?: undefined;
            id?: undefined;
            type?: undefined;
            content?: undefined;
            selectors?: undefined;
            color?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title?: undefined;
            summary?: undefined;
            body?: undefined;
            tags?: undefined;
            featuredImage?: undefined;
            slug?: undefined;
            publishDate?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            draftSlug?: undefined;
            status?: undefined;
            id?: undefined;
            type?: undefined;
            content?: undefined;
            selectors?: undefined;
            color?: undefined;
            parentId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            slug: {
                type: string;
                description: string;
            };
            publishDate: {
                type: string;
                description: string;
            };
            title?: undefined;
            summary?: undefined;
            body?: undefined;
            tags?: undefined;
            featuredImage?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            draftSlug?: undefined;
            status?: undefined;
            id?: undefined;
            type?: undefined;
            content?: undefined;
            selectors?: undefined;
            color?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            data: {
                type: string;
                description: string;
            };
            filename: {
                type: string;
                description: string;
            };
            altText: {
                type: string;
                description: string;
            };
            title?: undefined;
            summary?: undefined;
            body?: undefined;
            tags?: undefined;
            featuredImage?: undefined;
            slug?: undefined;
            publishDate?: undefined;
            draftSlug?: undefined;
            status?: undefined;
            id?: undefined;
            type?: undefined;
            content?: undefined;
            selectors?: undefined;
            color?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            draftSlug: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            title?: undefined;
            summary?: undefined;
            body?: undefined;
            tags?: undefined;
            featuredImage?: undefined;
            slug?: undefined;
            publishDate?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            id?: undefined;
            type?: undefined;
            content?: undefined;
            selectors?: undefined;
            color?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            title?: undefined;
            summary?: undefined;
            body?: undefined;
            tags?: undefined;
            featuredImage?: undefined;
            slug?: undefined;
            publishDate?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            draftSlug?: undefined;
            status?: undefined;
            type?: undefined;
            content?: undefined;
            selectors?: undefined;
            color?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            draftSlug: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            selectors: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
            color: {
                type: string;
                description: string;
            };
            parentId: {
                type: string;
                description: string;
            };
            title?: undefined;
            summary?: undefined;
            body?: undefined;
            tags?: undefined;
            featuredImage?: undefined;
            slug?: undefined;
            publishDate?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            status?: undefined;
            id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            color: {
                type: string;
                description: string;
            };
            title?: undefined;
            summary?: undefined;
            body?: undefined;
            tags?: undefined;
            featuredImage?: undefined;
            slug?: undefined;
            publishDate?: undefined;
            data?: undefined;
            filename?: undefined;
            altText?: undefined;
            draftSlug?: undefined;
            type?: undefined;
            selectors?: undefined;
            parentId?: undefined;
        };
        required: string[];
    };
})[];
export type ToolInput = Record<string, unknown>;
export type ToolResult = {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
};
declare function handleTool(name: string, input: ToolInput): Promise<ToolResult>;
export { toolDefinitions as tools, handleTool };
