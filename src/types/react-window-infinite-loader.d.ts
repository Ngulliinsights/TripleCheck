declare module 'react-window-infinite-loader' {
  import { ComponentType } from 'react';

  interface InfiniteLoaderProps {
    isItemLoaded: (index: number) => boolean;
    itemCount: number;
    loadMoreItems: () => Promise<void>;
    children: (props: {
      onItemsRendered: any;
      ref: any;
    }) => React.ReactNode;
  }

  const InfiniteLoader: ComponentType<InfiniteLoaderProps>;
  export default InfiniteLoader;
}