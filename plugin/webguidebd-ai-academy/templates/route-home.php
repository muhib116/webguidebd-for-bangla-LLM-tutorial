<?php
/**
 * Course landing — W3Schools tutorial-hub style.
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header( array( 'title' => 'WebGuideBD AI Academy' ) );
$chapters = \WGBA\Content_Repository::list_chapters( true );
?>
<section class="wgba-home-hero" aria-labelledby="wgba-hero-title">
	<div class="wgba-wrap">
		<p class="wgba-eyebrow">বিনামূল্যে · বাংলায় · Practical AI Engineering</p>
		<h1 id="wgba-hero-title">WebGuideBD AI Academy</h1>
		<p class="wgba-lead">Muhibbullah Ansary-এর তৈরি AI ও LLM কোর্স—প্রথমে ধারণা, তারপর JavaScript অনুশীলন, পরে গভীর প্রকৌশল। W3Schools-এর মতো সহজ পাঠ → উদাহরণ → অনুশীলন ফ্লো।</p>
		<p class="wgba-actions">
			<a class="wgba-btn" href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', 'ai-ki' ) ); ?>">প্রথম পাঠ শুরু »</a>
			<a class="wgba-btn wgba-btn-ghost" href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">সব Tutorials</a>
		</p>
		<p class="wgba-muted"><?php echo esc_html( \WGBA\Access::message_preview_hint() ); ?> <?php echo esc_html( \WGBA\Access::message_login_for_chapters() ); ?></p>
	</div>
</section>
<section class="wgba-wrap wgba-section" aria-labelledby="wgba-chapters-title">
	<div class="wgba-section-head">
		<h2 id="wgba-chapters-title">Tutorials</h2>
		<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">পূর্ণ রোডম্যাপ »</a>
	</div>
	<ul class="wgba-tut-list">
		<?php foreach ( $chapters as $ch ) : ?>
			<?php
			$public  = \WGBA\Access::is_public_preview_chapter( (string) $ch['stable_id'] );
			$url     = \WGBA\Rewrite::url( 'chapter', (string) $ch['slug'] );
			$logged  = is_user_logged_in();
			$badge_c = $public || $logged ? 'is-public' : 'is-login';
			$badge_t = $public ? 'Public' : ( $logged ? 'Unlocked' : 'Login' );
			?>
			<li>
				<a class="wgba-tut-item" href="<?php echo esc_url( $url ); ?>">
					<span class="wgba-tut-meta">
						<span class="wgba-badge <?php echo esc_attr( $badge_c ); ?>">
							<?php echo esc_html( $badge_t ); ?>
						</span>
					</span>
					<strong><?php echo esc_html( (string) $ch['title'] ); ?></strong>
					<p><?php echo esc_html( (string) $ch['summary'] ); ?></p>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>
	<p class="wgba-coming">অধ্যায় ১–২ বিনা লগইনে পড়ুন। অধ্যায় ৩–১৪ বিনামূল্যে—লগইন করে পূর্ণ পাঠ, অনুশীলন ও অগ্রগতি সংরক্ষণ করুন।</p>
</section>
<?php
\WGBA\Templates::footer();
