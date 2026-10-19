<?php
/**
 * WordPress core sitemap provider for Academy public URLs.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

/**
 * @extends \WP_Sitemaps_Provider
 */
final class Sitemap_Provider extends \WP_Sitemaps_Provider {

	public function __construct() {
		$this->name        = 'wgba';
		$this->object_type = 'wgba';
	}

	/**
	 * @param int    $page_num Page.
	 * @param string $object_subtype Subtype.
	 * @return array<int,array<string,mixed>>
	 */
	public function get_url_list( $page_num, $object_subtype = '' ): array {
		if ( (int) $page_num > 1 ) {
			return array();
		}
		$list = array();
		foreach ( SEO::public_index_urls() as $row ) {
			if ( 'optional' === $row['kind'] && false === strpos( $row['loc'], 'glossary' ) ) {
				// Keep privacy/editorial out of WP core sitemap noise; main /sitemap.xml still has them.
				continue;
			}
			$list[] = array(
				'loc'     => $row['loc'],
				'lastmod' => $row['lastmod'],
			);
		}
		return $list;
	}

	/**
	 * @param string $object_subtype Subtype.
	 * @return int
	 */
	public function get_max_num_pages( $object_subtype = '' ): int {
		return 1;
	}
}
