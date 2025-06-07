
export interface ImageFileWithPreview {
  file: File;
  previewUrl: string;
}

export enum AppState {
  Idle = 'IDLE',
  LoadingDescriptivePrompt = 'LOADING_DESCRIPTIVE_PROMPT',
  LoadingGeneratedImage = 'LOADING_GENERATED_IMAGE',
  Success = 'SUCCESS',
  Error = 'ERROR',
}
