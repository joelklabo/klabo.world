interface AnnotationChange {
    type: 'created' | 'updated' | 'deleted';
    annotationId: string;
    draftSlug: string;
    timestamp: string;
}
export type AnnotationListener = (changes: AnnotationChange[]) => void;
export declare class AnnotationWatcherClient {
    private socket;
    private listeners;
    private reconnectTimer;
    private socketPath;
    constructor(socketPath?: string);
    connect(): Promise<void>;
    private handleMessage;
    private scheduleReconnect;
    onChanges(listener: AnnotationListener): () => void;
    disconnect(): void;
}
export {};
