import React from 'react';

type TweetProps = {
  id: string;
};

export function Tweet({ id }: TweetProps) {
  return <div data-testid="tweet-embed" data-tweet-id={id} />;
}
