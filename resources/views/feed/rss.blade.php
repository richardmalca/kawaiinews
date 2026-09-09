<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>{{ config('app.name') }}</title>
        <link>{{ url('/') }}</link>
        <description>Últimas noticias de anime, manga, gaming y geek</description>
        <language>es</language>
        <lastBuildDate>{{ now()->toRfc2822String() }}</lastBuildDate>
        @foreach ($articles as $article)
        <item>
            <title>{{ $article->title }}</title>
            <link>{{ url('/noticias/'.$article->slug) }}</link>
            <guid>{{ url('/noticias/'.$article->slug) }}</guid>
            <description>{{ $article->excerpt }}</description>
            <category>{{ $article->category }}</category>
            <pubDate>{{ $article->published_at->toRfc2822String() }}</pubDate>
        </item>
        @endforeach
    </channel>
</rss>
