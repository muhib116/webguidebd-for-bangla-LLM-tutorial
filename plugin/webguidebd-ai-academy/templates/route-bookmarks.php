<?php
defined( 'ABSPATH' ) || exit;
if ( ! is_user_logged_in() ) {
	wp_safe_redirect( \WGBA\Rewrite::url( 'login' ) );
	exit;
}
\WGBA\Templates::header();
global $wpdb;
$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM ' . $wpdb->prefix . 'wgba_bookmarks WHERE user_id = %d ORDER BY created_at DESC', get_current_user_id() ), ARRAY_A );

\WGBA\Templates::page_hero(
	array(
		'title'  => 'বুকমার্ক',
		'lead'   => 'সংরক্ষিত পাঠ ও টার্গেট।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'ড্যাশবোর্ড', 'url' => \WGBA\Rewrite::url( 'dashboard' ) ),
			array( 'label' => 'বুকমার্ক' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<?php if ( $rows ) : ?>
		<ul class="wgba-tut-list">
			<?php foreach ( (array) $rows as $row ) : ?>
				<li>
					<div class="wgba-tut-item">
						<strong><?php echo esc_html( (string) $row['target_type'] ); ?></strong>
						<p><code><?php echo esc_html( (string) $row['target_stable_id'] ); ?></code></p>
					</div>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php else : ?>
		<p class="wgba-coming">এখনও বুকমার্ক নেই।</p>
	<?php endif; ?>
</section>
<?php
\WGBA\Templates::footer();
