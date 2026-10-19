<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
if ( ! is_user_logged_in() ) {
	wp_safe_redirect( \WGBA\Rewrite::url( 'login' ) );
	exit;
}
$stats       = \WGBA\Progress::course_reading_stats( get_current_user_id() );
$last        = (string) get_user_meta( get_current_user_id(), 'wgba_last_lesson', true );
$last_lesson = $last ? \WGBA\Content_Repository::get_lesson_by_stable_id( $last ) : null;
$pct         = (float) $stats['reading_percent'];

\WGBA\Templates::page_hero(
	array(
		'title'  => 'আপনার ড্যাশবোর্ড',
		'lead'   => 'পড়া ও অনুশীলন আলাদা স্ট্যাটাস—একটি অস্পষ্ট শতাংশে মেশানো হয়নি।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'ড্যাশবোর্ড' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section wgba-dash">
	<div class="wgba-dash-grid">
		<section class="wgba-card">
			<h2>পড়ার অগ্রগতি</h2>
			<p><span class="wgba-progress-ring-label"><?php echo esc_html( (string) $stats['reading_percent'] ); ?>%</span></p>
			<div class="wgba-progress-bar" role="progressbar" aria-valuenow="<?php echo esc_attr( (string) max( 0, min( 100, $pct ) ) ); ?>" aria-valuemin="0" aria-valuemax="100">
				<span style="width: <?php echo esc_attr( (string) max( 0, min( 100, $pct ) ) ); ?>%"></span>
			</div>
			<p><strong><?php echo (int) $stats['required_complete']; ?></strong> / <?php echo (int) $stats['required_total']; ?> আবশ্যক পাঠ সম্পন্ন</p>
			<p class="wgba-muted">অনুশীলন চেকপয়েন্ট: <?php echo (int) $stats['practice_complete']; ?></p>
			<?php if ( $last_lesson ) : ?>
				<p class="wgba-actions">
					<a class="wgba-btn" href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', (string) $last_lesson['slug'] ) ); ?>">শেখা চালিয়ে যান »</a>
				</p>
			<?php endif; ?>
		</section>
		<section class="wgba-card">
			<h2>দ্রুত লিংক</h2>
			<ul class="wgba-dash-links">
				<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'notes' ) ); ?>">নোট</a></li>
				<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'bookmarks' ) ); ?>">বুকমার্ক</a></li>
				<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'questions' ) ); ?>">আমার প্রশ্ন</a></li>
				<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">রোডম্যাপ</a></li>
				<li><a href="<?php echo esc_url( rest_url( 'wgba/v1/me/export' ) ); ?>">ডেটা এক্সপোর্ট</a></li>
			</ul>
		</section>
	</div>
</section>
<?php
\WGBA\Templates::footer();
