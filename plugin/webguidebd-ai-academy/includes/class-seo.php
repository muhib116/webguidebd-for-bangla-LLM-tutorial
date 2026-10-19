<?php
/**
 * Indexing, sitemap, llms.txt, structured data — public fields only.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class SEO {

	/** @var list<string> */
	private static $noindex_routes = array(
		'dashboard',
		'login',
		'register',
		'lost_password',
		'reset_password',
		'profile',
		'notes',
		'bookmarks',
		'questions',
	);

	public static function register(): void {
		add_action( 'wp_head', array( self::class, 'head_tags' ), 1 );
		add_filter( 'pre_get_document_title', array( self::class, 'document_title' ), 20 );
		add_action( 'template_redirect', array( self::class, 'maybe_indexing_endpoints' ), 0 );
		add_filter( 'robots_txt', array( self::class, 'filter_robots_txt' ), 20, 2 );
		add_action( 'init', array( self::class, 'register_wp_sitemap_provider' ), 30 );
	}

	/**
	 * Serve /sitemap.xml, /ai-academy/sitemap.xml, /llms.txt, /ai-academy/llms.txt.
	 * Uses REQUEST_URI so it works even before rewrite flush.
	 */
	public static function maybe_indexing_endpoints(): void {
		if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
			return;
		}
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
		$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
		$path        = untrailingslashit( $path );

		$route = (string) get_query_var( 'wgba_route' );

		if ( 'sitemap' === $route || preg_match( '#/(?:ai-academy/)?sitemap\.xml$#', $path ) ) {
			self::serve_sitemap();
		}
		if ( 'llms' === $route || preg_match( '#/(?:ai-academy/)?llms\.txt$#', $path ) ) {
			self::serve_llms_txt();
		}
	}

	/** @deprecated Use maybe_indexing_endpoints. */
	public static function maybe_sitemap(): void {
		self::maybe_indexing_endpoints();
	}

	public static function serve_sitemap(): void {
		nocache_headers();
		header( 'Content-Type: application/xml; charset=UTF-8' );
		status_header( 200 );

		$urls = self::public_index_urls();

		echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
		echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
		foreach ( $urls as $row ) {
			self::url_entry( $row['loc'], $row['lastmod'] );
		}
		echo '</urlset>';
		exit;
	}

	public static function serve_llms_txt(): void {
		nocache_headers();
		header( 'Content-Type: text/plain; charset=UTF-8' );
		status_header( 200 );
		echo self::build_llms_txt();
		exit;
	}

	/**
	 * Public URLs for search + LLM discovery (preview chapters' lessons only).
	 *
	 * @return list<array{loc:string,lastmod:string,title:string,summary:string,kind:string}>
	 */
	public static function public_index_urls(): array {
		$now  = gmdate( 'c' );
		$urls = array(
			array(
				'loc'     => Rewrite::url( 'home' ),
				'lastmod' => $now,
				'title'   => 'WebGuideBD AI Academy',
				'summary' => 'বাংলায় practical AI ও LLM কোর্স — বিনামূল্যে।',
				'kind'    => 'home',
			),
			array(
				'loc'     => Rewrite::url( 'roadmap' ),
				'lastmod' => $now,
				'title'   => 'পাঠ্যক্রম / Roadmap',
				'summary' => 'সব অধ্যায় ও পাঠের মানচিত্র।',
				'kind'    => 'page',
			),
			array(
				'loc'     => Rewrite::url( 'author' ),
				'lastmod' => $now,
				'title'   => 'আমাদের সম্পর্কে — Muhibbullah Ansary',
				'summary' => 'প্রতিষ্ঠাতা ও শিক্ষক পরিচিতি।',
				'kind'    => 'page',
			),
			array(
				'loc'     => Rewrite::url( 'contact' ),
				'lastmod' => $now,
				'title'   => 'যোগাযোগ',
				'summary' => 'Contact WebGuideBD AI Academy.',
				'kind'    => 'page',
			),
			array(
				'loc'     => Rewrite::url( 'glossary' ),
				'lastmod' => $now,
				'title'   => 'শব্দকোষ',
				'summary' => 'AI ও LLM টার্মের বাংলা ব্যাখ্যা।',
				'kind'    => 'page',
			),
			array(
				'loc'     => Rewrite::url( 'privacy' ),
				'lastmod' => $now,
				'title'   => 'গোপনীয়তা নীতি',
				'summary' => 'Privacy policy.',
				'kind'    => 'optional',
			),
			array(
				'loc'     => Rewrite::url( 'editorial' ),
				'lastmod' => $now,
				'title'   => 'সম্পাদকীয় নীতি',
				'summary' => 'Editorial standards.',
				'kind'    => 'optional',
			),
		);

		try {
			foreach ( Content_Repository::list_chapters( true ) as $chapter ) {
				$ch_id = (string) ( $chapter['stable_id'] ?? '' );
				$urls[] = array(
					'loc'     => Rewrite::url( 'chapter', (string) $chapter['slug'] ),
					'lastmod' => $now,
					'title'   => (string) $chapter['title'],
					'summary' => (string) ( $chapter['summary'] ?? '' ),
					'kind'    => 'chapter',
				);
				if ( ! Access::is_public_preview_chapter( $ch_id ) ) {
					continue;
				}
				foreach ( Content_Repository::list_lessons_for_chapter( $ch_id, true ) as $lesson ) {
					$mod = ! empty( $lesson['modified_gmt'] )
						? gmdate( 'c', (int) strtotime( (string) $lesson['modified_gmt'] . ' UTC' ) )
						: $now;
					$urls[] = array(
						'loc'     => Rewrite::url( 'lesson', (string) $lesson['slug'] ),
						'lastmod' => $mod,
						'title'   => (string) $lesson['title'],
						'summary' => (string) ( $lesson['summary'] ?? '' ),
						'kind'    => 'lesson',
					);
				}
			}
		} catch ( \Throwable $e ) {
			// Keep core pages even if content query fails.
		}

		return $urls;
	}

	public static function build_llms_txt(): string {
		$home     = Rewrite::url( 'home' );
		$sitemap  = home_url( '/sitemap.xml' );
		$lines    = array();
		$lines[]  = '# WebGuideBD AI Academy';
		$lines[]  = '';
		$lines[]  = '> Free Bangla course on practical AI & LLM engineering — concepts first, then JavaScript practice. Author: Muhibbullah Ansary. Site: Web Guide BD.';
		$lines[]  = '';
		$lines[]  = 'Language: Bengali (bn) primary; English technical terms kept where useful.';
		$lines[]  = 'Access: Chapters 1–2 are public; later chapters need a free login for full lesson bodies (public overview still available).';
		$lines[]  = 'Do not invent ratings, student counts, or phone numbers not listed on the site.';
		$lines[]  = 'Sitemap (search engines): ' . $sitemap;
		$lines[]  = 'Canonical academy home: ' . $home;
		$lines[]  = '';

		$urls = self::public_index_urls();

		$lines[] = '## Start here';
		foreach ( $urls as $row ) {
			if ( ! in_array( $row['kind'], array( 'home', 'page' ), true ) ) {
				continue;
			}
			$lines[] = self::llms_link( $row );
		}
		$lines[] = '';

		$lines[] = '## Public lessons (no login)';
		$has_lesson = false;
		foreach ( $urls as $row ) {
			if ( 'lesson' !== $row['kind'] ) {
				continue;
			}
			$has_lesson = true;
			$lines[]    = self::llms_link( $row );
		}
		if ( ! $has_lesson ) {
			$lines[] = '- (No public lessons indexed yet — check /ai-academy/roadmap/)';
		}
		$lines[] = '';

		$lines[] = '## Chapters';
		foreach ( $urls as $row ) {
			if ( 'chapter' !== $row['kind'] ) {
				continue;
			}
			$lines[] = self::llms_link( $row );
		}
		$lines[] = '';

		$lines[] = '## Optional';
		$lines[] = '- [Sitemap XML](' . $sitemap . '): All public indexable URLs for crawlers';
		$lines[] = '- [Academy sitemap](' . home_url( '/ai-academy/sitemap.xml' ) . '): Same urlset under /ai-academy/';
		foreach ( $urls as $row ) {
			if ( 'optional' !== $row['kind'] ) {
				continue;
			}
			$lines[] = self::llms_link( $row );
		}
		$lines[] = '';

		return implode( "\n", $lines );
	}

	/**
	 * @param array{loc:string,title:string,summary:string} $row Row.
	 */
	private static function llms_link( array $row ): string {
		$title = trim( $row['title'] ) !== '' ? $row['title'] : $row['loc'];
		$note  = trim( (string) ( $row['summary'] ?? '' ) );
		$line  = '- [' . self::md_escape( $title ) . '](' . $row['loc'] . ')';
		if ( $note !== '' ) {
			$line .= ': ' . self::md_escape( $note );
		}
		return $line;
	}

	private static function md_escape( string $s ): string {
		return str_replace( array( '[', ']', "\n", "\r" ), array( '\\[', '\\]', ' ', ' ' ), $s );
	}

	private static function url_entry( string $loc, string $lastmod ): void {
		echo '<url><loc>' . esc_url( $loc ) . '</loc><lastmod>' . esc_html( $lastmod ) . '</lastmod></url>' . "\n";
	}

	/**
	 * Advertise Academy sitemap + llms.txt discovery in robots.txt.
	 *
	 * @param string $output Robots text.
	 * @param bool   $public Blog public.
	 */
	public static function filter_robots_txt( string $output, $public ): string {
		if ( ! $public ) {
			return $output;
		}
		if ( false !== strpos( $output, 'ai-academy/sitemap.xml' ) && false !== strpos( $output, '/llms.txt' ) ) {
			return $output;
		}
		$output .= "\n# WebGuideBD AI Academy\n";
		$output .= 'Sitemap: ' . home_url( '/sitemap.xml' ) . "\n";
		$output .= 'Sitemap: ' . home_url( '/ai-academy/sitemap.xml' ) . "\n";
		$output .= '# LLM / agent index: ' . home_url( '/llms.txt' ) . "\n";
		return $output;
	}

	/**
	 * Also list Academy URLs inside WordPress core sitemap when available.
	 */
	public static function register_wp_sitemap_provider(): void {
		if ( ! function_exists( 'wp_register_sitemap_provider' ) || ! class_exists( '\WP_Sitemaps_Provider' ) ) {
			return;
		}
		require_once WGBA_PLUGIN_DIR . 'includes/class-sitemap-provider.php';
		wp_register_sitemap_provider( 'wgba', new Sitemap_Provider() );
	}

	public static function head_tags(): void {
		$route = get_query_var( 'wgba_route' );
		if ( ! $route ) {
			return;
		}
		echo '<meta name="language" content="bn" />' . "\n";
		echo '<link rel="alternate" hreflang="bn" href="' . esc_url( self::canonical_for_route() ) . '" />' . "\n";
		echo '<link rel="describedby" href="' . esc_url( home_url( '/llms.txt' ) ) . '" title="llms.txt" />' . "\n";
		echo '<link rel="sitemap" type="application/xml" href="' . esc_url( home_url( '/sitemap.xml' ) ) . '" />' . "\n";

		if ( in_array( $route, self::$noindex_routes, true ) ) {
			echo '<meta name="robots" content="noindex,nofollow" />' . "\n";
			return;
		}

		if ( 'lesson' === $route ) {
			$lesson = Content_Repository::get_lesson_by_slug( (string) get_query_var( 'wgba_slug' ) );
			if ( $lesson && ! Access::is_public_preview_chapter( (string) $lesson['chapter_stable_id'] ) ) {
				echo '<meta name="robots" content="noindex,follow" />' . "\n";
			}
		}

		$canonical = self::canonical_for_route();
		echo '<link rel="canonical" href="' . esc_url( $canonical ) . '" />' . "\n";
		self::json_ld();
	}

	/**
	 * @param mixed $title Title.
	 * @return string
	 */
	public static function document_title( $title ): string {
		$title = is_string( $title ) ? $title : '';
		$route = get_query_var( 'wgba_route' );
		if ( ! $route ) {
			return $title;
		}
		if ( 'lesson' === $route ) {
			$lesson = Content_Repository::get_lesson_by_slug( (string) get_query_var( 'wgba_slug' ) );
			if ( $lesson ) {
				return $lesson['title'] . ' | WebGuideBD AI Academy';
			}
		}
		if ( 'chapter' === $route ) {
			$chapter = Content_Repository::get_chapter_by_slug( (string) get_query_var( 'wgba_slug' ) );
			if ( $chapter ) {
				return $chapter['title'] . ' | WebGuideBD AI Academy';
			}
		}
		$map = array(
			'home'     => 'WebGuideBD AI Academy — বাংলায় AI ও LLM',
			'roadmap'  => 'পাঠ্যক্রম | WebGuideBD AI Academy',
			'author'   => 'আমাদের সম্পর্কে — Muhibbullah Ansary | WebGuideBD AI Academy',
			'contact'  => 'যোগাযোগ — Muhibbullah Ansary | WebGuideBD AI Academy',
			'glossary' => 'শব্দকোষ | WebGuideBD AI Academy',
		);
		return $map[ $route ] ?? 'WebGuideBD AI Academy';
	}

	private static function canonical_for_route(): string {
		$route = (string) get_query_var( 'wgba_route' );
		$slug  = (string) get_query_var( 'wgba_slug' );
		if ( in_array( $route, array( 'lesson', 'chapter', 'glossary_term' ), true ) ) {
			return Rewrite::url( $route === 'glossary_term' ? 'glossary_term' : $route, $slug );
		}
		return Rewrite::url( $route ?: 'home' );
	}

	private static function json_ld(): void {
		$graph = array(
			'@context' => 'https://schema.org',
			'@graph'   => array(
				array(
					'@type'      => 'WebSite',
					'@id'        => home_url( '/#website' ),
					'url'        => home_url( '/' ),
					'name'       => 'Web Guide BD',
					'inLanguage' => 'bn',
				),
				array(
					'@type' => 'Person',
					'@id'   => Rewrite::url( 'author' ) . '#person',
					'name'  => 'Muhibbullah Ansary',
					'url'   => Rewrite::url( 'author' ),
				),
				array(
					'@type'               => 'Course',
					'@id'                 => Rewrite::url( 'home' ) . '#course',
					'name'                => 'WebGuideBD AI Academy — AI ও LLM কোর্স',
					'description'         => 'বাংলায় practical AI engineering ও LLM ভিত্তি — বিনামূল্যে।',
					'provider'            => array(
						'@type' => 'Organization',
						'name'  => 'Web Guide BD',
						'url'   => home_url( '/' ),
					),
					'instructor'          => array( '@id' => Rewrite::url( 'author' ) . '#person' ),
					'isAccessibleForFree' => true,
					'inLanguage'          => 'bn',
					'url'                 => Rewrite::url( 'home' ),
				),
			),
		);
		echo '<script type="application/ld+json">' . wp_json_encode( $graph, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
	}
}
