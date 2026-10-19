<?php
/**
 * Chapter overview.
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;
$slug    = (string) get_query_var( 'wgba_slug' );
$chapter = \WGBA\Content_Repository::get_chapter_by_slug( $slug );
$staff   = \WGBA\Capabilities::can_manage_curriculum() || \WGBA\Access::user_is_admin();

// Draft placeholder shells → published twin (same menu_order).
if ( $chapter && 'publish' !== $chapter['status'] ) {
	$order = (int) ( $chapter['menu_order'] ?? 0 );
	foreach ( \WGBA\Content_Repository::list_chapters( true ) as $pub ) {
		if ( (int) ( $pub['menu_order'] ?? 0 ) === $order && (string) $pub['slug'] !== (string) $chapter['slug'] ) {
			wp_safe_redirect( \WGBA\Rewrite::url( 'chapter', (string) $pub['slug'] ), 302 );
			exit;
		}
	}
	if ( ! $staff && ! current_user_can( 'edit_posts' ) ) {
		$chapter = null;
	}
}

\WGBA\Templates::header();
if ( ! $chapter || ( 'publish' !== $chapter['status'] && ! $staff && ! current_user_can( 'edit_posts' ) ) ) {
	\WGBA\Templates::page_hero(
		array(
			'title'  => 'অধ্যায় পাওয়া যায়নি',
			'lead'   => 'এই লিংকটি আর নেই বা এখনও প্রকাশিত হয়নি।',
			'crumbs' => array(
				array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
				array( 'label' => 'অধ্যায়' ),
			),
		)
	);
	echo '<section class="wgba-wrap wgba-section"><p class="wgba-coming"><a href="' . esc_url( \WGBA\Rewrite::url( 'roadmap' ) ) . '">রোডম্যাপ দেখুন »</a></p></section>';
	\WGBA\Templates::footer();
	return;
}
$public = \WGBA\Access::is_public_preview_chapter( (string) $chapter['stable_id'] );
$logged = is_user_logged_in() || $staff;
if ( $public ) {
	$badge_c = 'is-public';
	$badge_t = 'পাবলিক অধ্যায়';
} elseif ( $logged ) {
	$badge_c = 'is-public';
	$badge_t = $staff ? 'অ্যাডমিন — পূর্ণ পাঠ খোলা' : 'লগইন করা আছে — পূর্ণ পাঠ খোলা';
} else {
	$badge_c = 'is-login';
	$badge_t = 'পূর্ণ পাঠের জন্য লগইন';
}

\WGBA\Templates::page_hero(
	array(
		'title'  => (string) $chapter['title'],
		'lead'   => (string) $chapter['summary'],
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'Tutorials', 'url' => \WGBA\Rewrite::url( 'roadmap' ) ),
			array( 'label' => (string) $chapter['title'] ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<p><span class="wgba-badge <?php echo esc_attr( $badge_c ); ?>"><?php echo esc_html( $badge_t ); ?></span></p>
	<div class="wgba-prose"><?php echo wp_kses_post( (string) $chapter['body'] ); ?></div>
	<section class="wgba-card" aria-label="পাঠ তালিকা">
		<div class="wgba-section-head">
			<h2>এই অধ্যায়ের পাঠ</h2>
		</div>
		<ol class="wgba-lesson-list">
			<?php foreach ( \WGBA\Content_Repository::list_lessons_for_chapter( (string) $chapter['stable_id'], true ) as $lesson ) : ?>
				<li>
					<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', (string) $lesson['slug'] ) ); ?>">
						<?php echo esc_html( (string) $lesson['title'] ); ?>
					</a>
					<span class="wgba-muted"> · <?php echo (int) $lesson['estimated_minutes']; ?> মিনিট</span>
				</li>
			<?php endforeach; ?>
		</ol>
	</section>
</section>
<?php
\WGBA\Templates::footer();
