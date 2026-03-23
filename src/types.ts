export interface Page {
  id: string;
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface Story {
  id?: string;
  userId: string;
  title: string;
  theme: string;
  characterDescription: string;
  pages: Page[];
  createdAt: any;
  updatedAt: any;
}

export interface StoryOutline {
  title: string;
  masterCharacterDescription: string;
  masterStyleDescription: string;
  pages: {
    text: string;
    imagePrompt: string;
  }[];
}
