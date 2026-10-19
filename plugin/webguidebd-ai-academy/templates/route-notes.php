<?php
defined( 'ABSPATH' ) || exit;
if ( ! is_user_logged_in() ) {
	wp_safe_redirect( \WGBA\Rewrite::url( 'login' ) );
	exit;
}
\WGBA\Templates::header();
global $wpdb;
$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM ' . $wpdb->prefix . 'wgba_notes WHERE user_id = %d ORDER BY updated_at DESC', get_current_user_id() ), ARRAY_A );

\WGBA\Templates::page_hero(
	array(
		'title'  => 'আমার নোট',
		'lead'   => 'পাঠ থেকে সংরক্ষিত নোট।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'ড্যাশবোর্ড', 'url' => \WGBA\Rewrite::url( 'dashboard' ) ),
			array( 'label' => 'নোট' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<?php foreach ( (array) $rows as $row ) : ?>
		<article class="wgba-card">
			<h2><code><?php echo esc_html( (string) $row['lesson_stable_id'] ); ?></code></h2>
			<pre class="wgba-note-body"><?php echo esc_html( (string) $row['body'] ); ?></pre>
		</article>
	<?php endforeach; ?>
	<?php if ( ! $rows ) : ?>
		<p class="wgba-coming">এখনও নোট নেই। পাঠ পড়তে গিয়ে নোট যোগ করুন।</p>
	<?php endif; ?>
</section>
<?php
\WGBA\Templates::footer();
