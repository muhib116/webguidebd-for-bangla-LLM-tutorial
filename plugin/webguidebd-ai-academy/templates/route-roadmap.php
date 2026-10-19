<?php
/**
 * Curriculum roadmap.
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
\WGBA\Templates::page_hero(
	array(
		'title'  => 'পাঠ্যক্রম রোডম্যাপ',
		'lead'   => \WGBA\Access::message_preview_hint() . ' ' . \WGBA\Access::message_login_for_chapters(),
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'পাঠ্যক্রম' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-section-head">
		<h2>সব অধ্যায়</h2>
		<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'home' ) ); ?>">হোমে ফিরুন »</a>
	</div>
	<div class="wgba-roadmap-list">
		<?php foreach ( \WGBA\Content_Repository::list_chapters( true ) as $ch ) : ?>
			<section class="wgba-card">
				<h2><?php echo esc_html( (string) $ch['title'] ); ?>
					<?php
					$public = \WGBA\Access::is_public_preview_chapter( (string) $ch['stable_id'] );
					$logged = is_user_logged_in();
					if ( $public ) {
						echo '<span class="wgba-badge is-public">পাবলিক</span>';
					} elseif ( $logged ) {
						echo '<span class="wgba-badge is-public">খোলা</span>';
					} else {
						echo '<span class="wgba-badge is-login">লগইন</span>';
					}
					?>
				</h2>
				<p class="wgba-muted"><?php echo esc_html( (string) $ch['summary'] ); ?></p>
				<ol>
					<?php foreach ( \WGBA\Content_Repository::list_lessons_for_chapter( (string) $ch['stable_id'], true ) as $lesson ) : ?>
						<li>
							<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', (string) $lesson['slug'] ) ); ?>"><?php echo esc_html( (string) $lesson['title'] ); ?></a>
							<span class="wgba-muted"> · <?php echo (int) $lesson['estimated_minutes']; ?> মিনিট</span>
						</li>
					<?php endforeach; ?>
				</ol>
			</section>
		<?php endforeach; ?>
	</div>
</section>
<?php
\WGBA\Templates::footer();
