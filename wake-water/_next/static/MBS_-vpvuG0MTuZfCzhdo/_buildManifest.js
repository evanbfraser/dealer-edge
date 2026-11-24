self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/ingest/static/:path*"
      },
      {
        "source": "/ingest/:path*"
      },
      {
        "source": "/:path((?!api/|_next/|s/|ingest/|sgtm/|monitoring/|favicon\\.ico$).+\\.(?:txt|xml|xsl|json|webmanifest|ico|pdf|js|mjs|css|map|woff|woff2|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|avif|mp4|webm))",
        "destination": "/api/missing-asset"
      }
    ],
    "beforeFiles": [
      {
        "has": [
          {
            "type": "query",
            "key": "o",
            "value": "(?<orgid>\\d*)"
          },
          {
            "type": "query",
            "key": "p",
            "value": "(?<projectid>\\d*)"
          },
          {
            "type": "query",
            "key": "r",
            "value": "(?<region>[a-z]{2})"
          }
        ],
        "source": "/monitoring(/?)"
      },
      {
        "has": [
          {
            "type": "query",
            "key": "o",
            "value": "(?<orgid>\\d*)"
          },
          {
            "type": "query",
            "key": "p",
            "value": "(?<projectid>\\d*)"
          }
        ],
        "source": "/monitoring(/?)"
      },
      {
        "source": "/wp-content/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "source": "/wp-includes/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "source": "/wp-admin/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "source": "/wp-json/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "source": "/:site/wp-json/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "source": "/wp-login.php",
        "destination": "/api/legacy-gone"
      },
      {
        "source": "/xmlrpc.php",
        "destination": "/api/legacy-gone"
      },
      {
        "source": "/fiberglass-gelcoat-repair",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/tag/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/category/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/author/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/model/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/manufacturer/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/manufacturers/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/boat-type/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/testimonial/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/product/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/showroom/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/comments/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/xml/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/new-boats-instock/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/all-boats-in-stock/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/nashville/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/norrislake/:path*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/boat/:slug/:rest+",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/accessories/:sub/:rest*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/boat-service/:sub/:rest*",
        "destination": "/api/legacy-gone"
      },
      {
        "has": [
          {
            "type": "host",
            "value": "(?:www\\.)?premierwatersports\\.net"
          }
        ],
        "source": "/home/:sub/:rest*",
        "destination": "/api/legacy-gone"
      }
    ],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()