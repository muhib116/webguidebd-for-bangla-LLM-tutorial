<?php
/**
 * About Us — founder & platform (international brand page).
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
$p     = \WGBA\Site_Profile::get();
$name  = (string) $p['author_display_name'];
$photo = \WGBA\Site_Profile::photo_url();
$email = (string) $p['author_email'];
$phone = (string) $p['author_phone'];
$e164  = (string) $p['author_phone_e164'];
$wa    = 'https://wa.me/' . ltrim( $e164, '+' );
$yt    = (string) $p['author_youtube'];
$li    = (string) $p['author_linkedin'];
$fb    = (string) $p['author_facebook'];
$ig    = (string) $p['author_instagram'];

\WGBA\Templates::page_hero(
	array(
		'title'   => 'About Us',
		'eyebrow' => 'WebGuideBD · AI Academy · Bangladesh',
		'lead'    => 'Building practical AI education and business automation — for learners and operators who need clarity, not hype.',
		'crumbs'  => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'About Us' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section wgba-brand-page wgba-about-page">
	<section class="wgba-brand-intro" aria-labelledby="wgba-founder-name">
		<figure class="wgba-brand-portrait">
			<img src="<?php echo esc_url( $photo ); ?>" width="420" height="520" alt="<?php echo esc_attr( $name ); ?>">
		</figure>
		<div class="wgba-brand-intro-copy">
			<p class="wgba-brand-kicker">Founder &amp; Creator</p>
			<h2 id="wgba-founder-name"><?php echo esc_html( $name ); ?></h2>
			<p class="wgba-brand-role"><?php echo esc_html( (string) $p['author_role'] ); ?></p>
			<p class="wgba-brand-loc"><?php echo esc_html( (string) $p['author_location'] ); ?></p>
			<ul class="wgba-brand-highlights" aria-label="Focus">
				<li>Practical AI &amp; LLM education in Bangla</li>
				<li>WooCommerce COD automation (WooEasyLife)</li>
				<li>SaaS &amp; business workflow products</li>
			</ul>
			<div class="wgba-brand-actions">
				<a class="wgba-btn" href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">Contact</a>
				<a class="wgba-btn wgba-btn-ghost" href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">View curriculum</a>
			</div>
			<ul class="wgba-brand-social" aria-label="Social profiles">
				<li><a href="<?php echo esc_url( $yt ); ?>" rel="noopener">YouTube</a></li>
				<li><a href="<?php echo esc_url( $li ); ?>" rel="noopener">LinkedIn</a></li>
				<li><a href="<?php echo esc_url( $fb ); ?>" rel="noopener">Facebook</a></li>
				<li><a href="<?php echo esc_url( $ig ); ?>" rel="noopener">Instagram</a></li>
			</ul>
		</div>
	</section>

	<section class="wgba-brand-panel wgba-prose" aria-labelledby="wgba-bio-title">
		<header class="wgba-brand-panel-head">
			<h2 id="wgba-bio-title">Profile</h2>
			<p class="wgba-muted">পরিচিতি</p>
		</header>
		<?php echo wp_kses_post( (string) $p['author_bio'] ); ?>
	</section>

	<section class="wgba-brand-focus" aria-labelledby="wgba-exp-title">
		<header class="wgba-brand-panel-head">
			<h2 id="wgba-exp-title">Expertise</h2>
			<p class="wgba-muted">এক্সপার্টাইজ ও কাজের ক্ষেত্র</p>
		</header>
		<ol class="wgba-brand-focus-grid">
			<?php
			$i = 0;
			foreach ( (array) $p['author_expertise'] as $row ) :
				++$i;
				?>
				<li class="wgba-brand-focus-card">
					<span class="wgba-brand-focus-num" aria-hidden="true"><?php echo esc_html( str_pad( (string) $i, 2, '0', STR_PAD_LEFT ) ); ?></span>
					<h3><?php echo esc_html( (string) ( $row['title'] ?? '' ) ); ?></h3>
					<p><?php echo esc_html( (string) ( $row['body'] ?? '' ) ); ?></p>
				</li>
			<?php endforeach; ?>
		</ol>
	</section>

	<section class="wgba-brand-cta" aria-labelledby="wgba-academy-title">
		<div>
			<h2 id="wgba-academy-title">WebGuideBD AI Academy</h2>
			<p>A free, W3Schools-style path: lesson → example → practice. Chapters 1–2 are open without login; chapters 3–14 stay free with an account for progress and the in-browser runner.</p>
		</div>
		<p class="wgba-brand-actions">
			<a class="wgba-btn" href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">Open roadmap »</a>
			<a class="wgba-btn wgba-btn-ghost" href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">Get in touch</a>
		</p>
	</section>
</section>
<?php
\WGBA\Templates::footer();
