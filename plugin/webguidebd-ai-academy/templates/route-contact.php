<?php
/**
 * Contact Us — international brand contact page.
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
		'title'   => 'Contact Us',
		'eyebrow' => 'Reply as soon as possible · Bangladesh timezone',
		'lead'    => 'For AI Academy, Web Guide BD, WooEasyLife, or collaboration — reach out directly. No contact form; real channels only.',
		'crumbs'  => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'Contact Us' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section wgba-brand-page wgba-contact-page">
	<div class="wgba-contact-shell">
		<aside class="wgba-contact-person" aria-labelledby="wgba-contact-person-name">
			<img class="wgba-contact-avatar" src="<?php echo esc_url( $photo ); ?>" width="112" height="112" alt="<?php echo esc_attr( $name ); ?>">
			<h2 id="wgba-contact-person-name"><?php echo esc_html( $name ); ?></h2>
			<p class="wgba-brand-role"><?php echo esc_html( (string) $p['author_role'] ); ?></p>
			<p class="wgba-brand-loc"><?php echo esc_html( (string) $p['author_location'] ); ?></p>
			<a class="wgba-contact-profile-link" href="<?php echo esc_url( \WGBA\Rewrite::url( 'author' ) ); ?>">Full profile »</a>
			<ul class="wgba-brand-social" aria-label="Social profiles">
				<li><a href="<?php echo esc_url( $yt ); ?>" rel="noopener">YouTube</a></li>
				<li><a href="<?php echo esc_url( $li ); ?>" rel="noopener">LinkedIn</a></li>
				<li><a href="<?php echo esc_url( $fb ); ?>" rel="noopener">Facebook</a></li>
				<li><a href="<?php echo esc_url( $ig ); ?>" rel="noopener">Instagram</a></li>
			</ul>
		</aside>

		<div class="wgba-contact-main">
			<section aria-labelledby="wgba-channels-title">
				<header class="wgba-brand-panel-head">
					<h2 id="wgba-channels-title">Channels</h2>
					<p class="wgba-muted">যোগাযোগের মাধ্যম</p>
				</header>
				<ul class="wgba-channel-grid">
					<li class="wgba-channel-card">
						<span class="wgba-channel-label">Email</span>
						<a class="wgba-channel-value" href="<?php echo esc_url( 'mailto:' . $email ); ?>"><?php echo esc_html( $email ); ?></a>
						<a class="wgba-btn wgba-btn-small" href="<?php echo esc_url( 'mailto:' . $email ); ?>">Send email</a>
					</li>
					<li class="wgba-channel-card">
						<span class="wgba-channel-label">Phone</span>
						<a class="wgba-channel-value" href="<?php echo esc_url( 'tel:' . $e164 ); ?>"><?php echo esc_html( $phone ); ?></a>
						<a class="wgba-btn wgba-btn-small wgba-btn-ghost" href="<?php echo esc_url( 'tel:' . $e164 ); ?>">Call</a>
					</li>
					<li class="wgba-channel-card">
						<span class="wgba-channel-label">WhatsApp</span>
						<a class="wgba-channel-value" href="<?php echo esc_url( $wa ); ?>" rel="noopener">Chat on WhatsApp</a>
						<a class="wgba-btn wgba-btn-small wgba-btn-ghost" href="<?php echo esc_url( $wa ); ?>" rel="noopener">Open chat</a>
					</li>
				</ul>
			</section>

			<section class="wgba-brand-panel" aria-labelledby="wgba-topics-title">
				<header class="wgba-brand-panel-head">
					<h2 id="wgba-topics-title">What you can write about</h2>
					<p class="wgba-muted">কী নিয়ে লিখতে পারেন</p>
				</header>
				<ul class="wgba-topic-list">
					<li>
						<strong>AI Academy</strong>
						<span>Lesson feedback, bug reports, content suggestions</span>
					</li>
					<li>
						<strong>WooEasyLife / COD</strong>
						<span>WordPress · WooCommerce · fraud checks · courier automation</span>
					</li>
					<li>
						<strong>Custom build</strong>
						<span>Web apps, automation, and product discussion</span>
					</li>
					<li>
						<strong>Partnership</strong>
						<span>Workshops, collaboration, or distribution talks</span>
					</li>
				</ul>
				<p class="wgba-contact-note">Urgent? Prefer WhatsApp or phone. Your details are used only to reply — see the <a href="<?php echo esc_url( \WGBA\Rewrite::url( 'privacy' ) ); ?>">privacy policy</a>.</p>
			</section>
		</div>
	</div>
</section>
<?php
\WGBA\Templates::footer();
