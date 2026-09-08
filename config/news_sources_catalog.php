<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Catálogo de fuentes de noticias
    |--------------------------------------------------------------------------
    |
    | Lista de referencia de sitios que se pueden usar como fuente para el
    | scraping de noticias, agrupados por categoría. Es solo informativa
    | para la UI de administración: cada entrada se puede activar o
    | desactivar sin escribir código nuevo.
    |
    */

    'anime' => [
        'label' => 'Anime',
        'sources' => [
            'anime-news-network' => [
                'label' => 'Anime News Network',
                'url' => 'https://www.animenewsnetwork.com',
                'rss_url' => 'https://www.animenewsnetwork.com/all/rss.xml',
            ],
            'crunchyroll-news' => [
                'label' => 'Crunchyroll News',
                'url' => 'https://www.crunchyroll.com/news',
                'rss_url' => null,
            ],
            'myanimelist-news' => [
                'label' => 'MyAnimeList News',
                'url' => 'https://myanimelist.net/news',
                'rss_url' => 'https://myanimelist.net/rss/news.xml',
            ],
            'anmtv' => [
                'label' => 'ANMTV',
                'url' => 'https://www.anmtv.es',
                'rss_url' => 'https://www.anmtv.es/feed/',
            ],
            'ramen-para-dos' => [
                'label' => 'Ramen Para Dos',
                'url' => 'https://www.ramenparados.com',
                'rss_url' => 'https://www.ramenparados.com/feed',
            ],
            'somoskudasai' => [
                'label' => 'SomosKudasai',
                'url' => 'https://somoskudasai.com',
                'rss_url' => 'https://somoskudasai.com/feed',
            ],
            'anime-corner' => [
                'label' => 'Anime Corner',
                'url' => 'https://animecorner.me',
                'rss_url' => 'https://animecorner.me/feed/',
            ],
            'anitrendz' => [
                'label' => 'AniTrendz',
                'url' => 'https://anitrendz.net',
                'rss_url' => 'https://anitrendz.net/feed',
            ],
            'otakupt' => [
                'label' => 'OtakuPT',
                'url' => 'https://www.otakupt.com',
                'rss_url' => 'https://www.otakupt.com/feed/',
            ],
            'screenrant' => [
                'label' => 'ScreenRant',
                'url' => 'https://screenrant.com',
                'rss_url' => null,
            ],
            'otaku-study' => [
                'label' => "The Otaku's Study",
                'url' => 'https://www.otakustudy.com',
                'rss_url' => null,
            ],
        ],
    ],

    'manga' => [
        'label' => 'Manga',
        'sources' => [
            'ann-manga' => [
                'label' => 'Anime News Network Manga',
                'url' => 'https://www.animenewsnetwork.com/manga',
                'rss_url' => null,
            ],
            'anmtv-manga' => [
                'label' => 'ANMTV Manga',
                'url' => 'https://www.anmtv.es/category/manga/',
                'rss_url' => null,
            ],
            'somoskudasai-manga' => [
                'label' => 'SomosKudasai Manga',
                'url' => 'https://somoskudasai.com/noticias/manga/',
                'rss_url' => null,
            ],
        ],
    ],

    'geek' => [
        'label' => 'Geek / Tecnología',
        'sources' => [
            'kotaku' => [
                'label' => 'Kotaku',
                'url' => 'https://kotaku.com',
                'rss_url' => 'https://kotaku.com/rss',
            ],
            'ign' => [
                'label' => 'IGN',
                'url' => 'https://www.ign.com',
                'rss_url' => 'https://feeds.ign.com/ign/all',
            ],
            'xataka' => [
                'label' => 'Xataka',
                'url' => 'https://www.xataka.com',
                'rss_url' => 'https://www.xataka.com/feedburner.xml',
            ],
            'ign-espanol' => [
                'label' => 'IGN en Español',
                'url' => 'https://latam.ign.com',
                'rss_url' => null,
            ],
            'hipertextual' => [
                'label' => 'Hipertextual',
                'url' => 'https://hipertextual.com',
                'rss_url' => 'https://hipertextual.com/feed',
            ],
        ],
    ],

    'gaming' => [
        'label' => 'Gaming',
        'sources' => [
            'vandal' => [
                'label' => 'Vandal',
                'url' => 'https://vandal.elespanol.com',
                'rss_url' => 'https://vandal.elespanol.com/rss/noticias.xml',
            ],
            '3djuegos' => [
                'label' => '3DJuegos',
                'url' => 'https://www.3djuegos.com',
                'rss_url' => 'https://www.3djuegos.com/rss/noticias/',
            ],
            'hobbyconsolas' => [
                'label' => 'HobbyConsolas',
                'url' => 'https://www.hobbyconsolas.com',
                'rss_url' => 'https://www.hobbyconsolas.com/feed',
            ],
            'eurogamer' => [
                'label' => 'Eurogamer',
                'url' => 'https://www.eurogamer.net',
                'rss_url' => 'https://www.eurogamer.net/feed',
            ],
            'meristation' => [
                'label' => 'MeriStation',
                'url' => 'https://as.com/meristation',
                'rss_url' => null,
            ],
        ],
    ],

    'japon' => [
        'label' => 'Japón / Cultura',
        'sources' => [
            'soranews24' => [
                'label' => 'SoraNews24',
                'url' => 'https://soranews24.com',
                'rss_url' => 'https://soranews24.com/feed',
            ],
            'japan-times' => [
                'label' => 'The Japan Times',
                'url' => 'https://www.japantimes.co.jp',
                'rss_url' => 'https://www.japantimes.co.jp/feed',
            ],
            'nhk-world' => [
                'label' => 'NHK World',
                'url' => 'https://www3.nhk.or.jp/nhkworld',
                'rss_url' => null,
            ],
        ],
    ],

    'peliculas' => [
        'label' => 'Películas',
        'sources' => [
            'sensacine' => [
                'label' => 'Sensacine',
                'url' => 'https://www.sensacine.com',
                'rss_url' => null,
            ],
            'cinemascomics' => [
                'label' => 'Cinemascomics',
                'url' => 'https://www.cinemascomics.com',
                'rss_url' => 'https://www.cinemascomics.com/feed',
            ],
            'espinof' => [
                'label' => 'Espinof',
                'url' => 'https://www.espinof.com',
                'rss_url' => 'https://www.espinof.com/feed',
            ],
        ],
    ],
];
