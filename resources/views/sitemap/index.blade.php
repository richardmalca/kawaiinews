<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{{ url('/') }}</loc>
        <changefreq>hourly</changefreq>
        <priority>1.0</priority>
    </url>
    @foreach ($categories as $category)
    <url>
        <loc>{{ url('/categoria/'.$category) }}</loc>
        <changefreq>hourly</changefreq>
        <priority>0.7</priority>
    </url>
    @endforeach
    @foreach ($articles as $article)
    <url>
        <loc>{{ url('/noticias/'.$article->slug) }}</loc>
        <lastmod>{{ ($article->updated_at ?? $article->published_at)->toAtomString() }}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.6</priority>
    </url>
    @endforeach
</urlset>
