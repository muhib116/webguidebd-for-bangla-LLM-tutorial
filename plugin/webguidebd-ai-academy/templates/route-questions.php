<?php
defined( 'ABSPATH' ) || exit;
if ( ! is_user_logged_in() ) {
	wp_safe_redirect( \WGBA\Rewrite::url( 'login' ) );
	exit;
}
\WGBA\Templates::header();
global $wpdb;
$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM ' . $wpdb->prefix . 'wgba_questions WHERE user_id = %d ORDER BY created_at DESC', get_current_user_id() ), ARRAY_A );

\WGBA\Templates::page_hero(
	array(
		'title'  => 'আমার প্রশ্ন',
		'lead'   => 'ডিফল্টে ব্যক্তিগত। পাবলিক FAQ হতে হলে আলাদা সম্মতি ও মডারেশন লাগে।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'ড্যাশবোর্ড', 'url' => \WGBA\Rewrite::url( 'dashboard' ) ),
			array( 'label' => 'প্রশ্ন' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<?php foreach ( (array) $rows as $row ) : ?>
		<article class="wgba-card">
			<p><strong>স্ট্যাটাস:</strong> <?php echo esc_html( (string) $row['status'] ); ?> · <code><?php echo esc_html( (string) $row['lesson_stable_id'] ); ?></code></p>
			<p><?php echo esc_html( (string) $row['question_body'] ); ?></p>
			<?php if ( ! empty( $row['staff_reply'] ) ) : ?>
				<div class="wgba-reply"><strong>লেখকের উত্তর:</strong> <?php echo wp_kses_post( (string) $row['staff_reply'] ); ?></div>
			<?php endif; ?>
		</article>
	<?php endforeach; ?>
	<?php if ( ! $rows ) : ?>
		<p class="wgba-coming">এখনও প্রশ্ন নেই।</p>
	<?php endif; ?>
</section>
<?php
\WGBA\Templates::footer();
