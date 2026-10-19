<?php
/**
 * Shared mint page hero (matches home).
 *
 * Vars: $title (string), $lead (string), $eyebrow (string),
 *       $crumbs (list of label/url), $actions_html (string, trusted HTML).
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;
$title        = (string) ( $title ?? '' );
$lead         = (string) ( $lead ?? '' );
$eyebrow      = (string) ( $eyebrow ?? '' );
$crumbs       = is_array( $crumbs ?? null ) ? $crumbs : array();
$actions_html = (string) ( $actions_html ?? '' );
?>
<section class="wgba-page-hero" aria-labelledby="wgba-page-title">
	<div class="wgba-wrap">
		<?php if ( $crumbs ) : ?>
			<nav class="wgba-breadcrumb" aria-label="ব্রেডক্রাম্ব">
				<?php
				$parts = array();
				foreach ( $crumbs as $crumb ) {
					$label = (string) ( $crumb['label'] ?? '' );
					$url   = (string) ( $crumb['url'] ?? '' );
					if ( '' === $label ) {
						continue;
					}
					$parts[] = $url
						? '<a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a>'
						: esc_html( $label );
				}
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- each part escaped above.
				echo implode( ' / ', $parts );
				?>
			</nav>
		<?php endif; ?>
		<?php if ( $eyebrow ) : ?>
			<p class="wgba-eyebrow"><?php echo esc_html( $eyebrow ); ?></p>
		<?php endif; ?>
		<h1 id="wgba-page-title"><?php echo esc_html( $title ); ?></h1>
		<?php if ( $lead ) : ?>
			<p class="wgba-lead"><?php echo esc_html( $lead ); ?></p>
		<?php endif; ?>
		<?php if ( $actions_html ) : ?>
			<p class="wgba-actions">
				<?php
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- caller builds with esc_url/esc_html.
				echo $actions_html;
				?>
			</p>
		<?php endif; ?>
	</div>
</section>
