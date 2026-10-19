<?php
/**
 * Academy footer — founder + site links.
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;
$p     = \WGBA\Site_Profile::get();
$name  = (string) $p['author_display_name'];
$photo = \WGBA\Site_Profile::photo_url();
?>
</main>
<footer class="wgba-footer">
	<div class="wgba-footer-accent" aria-hidden="true"></div>
	<div class="wgba-footer-inner">
		<div class="wgba-footer-grid">
			<div class="wgba-footer-brand-block">
				<a class="wgba-footer-logo" href="<?php echo esc_url( \WGBA\Rewrite::url( 'home' ) ); ?>">
					<img
						class="wgba-brand-logo wgba-brand-logo-light"
						src="<?php echo esc_url( \WGBA\Site_Profile::logo_url( 'light' ) ); ?>"
						width="160"
						height="55"
						alt="Web Guide BD"
						decoding="async"
					>
					<img
						class="wgba-brand-logo wgba-brand-logo-dark"
						src="<?php echo esc_url( \WGBA\Site_Profile::logo_url( 'dark' ) ); ?>"
						width="160"
						height="55"
						alt=""
						decoding="async"
						aria-hidden="true"
					>
					<span class="wgba-footer-tag">বাংলায় practical AI ও LLM — বিনামূল্যে</span>
				</a>
				<div class="wgba-footer-founder">
					<img src="<?php echo esc_url( $photo ); ?>" width="64" height="64" alt="<?php echo esc_attr( $name ); ?>">
					<div>
						<strong><?php echo esc_html( $name ); ?></strong>
						<span><?php echo esc_html( (string) $p['author_role'] ); ?></span>
					</div>
				</div>
			</div>
			<div>
				<p class="wgba-footer-heading">শেখা</p>
				<ul class="wgba-footer-list">
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'home' ) ); ?>">হোম</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">Tutorials / রোডম্যাপ</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'glossary' ) ); ?>">শব্দকোষ</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'projects' ) ); ?>">প্রজেক্ট গ্যালারি</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'login' ) ); ?>">লগইন</a></li>
				</ul>
			</div>
			<div>
				<p class="wgba-footer-heading">প্রতিষ্ঠান</p>
				<ul class="wgba-footer-list">
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'author' ) ); ?>">About Us</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">Contact Us</a></li>
					<li><a href="<?php echo esc_url( (string) $p['author_youtube'] ); ?>" rel="noopener">YouTube</a></li>
					<li><a href="<?php echo esc_url( (string) $p['author_linkedin'] ); ?>" rel="noopener">LinkedIn</a></li>
					<li><a href="<?php echo esc_url( (string) $p['author_facebook'] ); ?>" rel="noopener">Facebook</a></li>
					<li><a href="<?php echo esc_url( (string) $p['author_instagram'] ); ?>" rel="noopener">Instagram</a></li>
				</ul>
			</div>
			<div>
				<p class="wgba-footer-heading">নীতি</p>
				<ul class="wgba-footer-list">
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'privacy' ) ); ?>">গোপনীয়তা</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'terms' ) ); ?>">শর্তাবলি</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'editorial' ) ); ?>">সম্পাদকীয় নীতি</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">সংশোধন জানান</a></li>
				</ul>
			</div>
		</div>
		<div class="wgba-footer-copy">
			<span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Web Guide BD · <?php echo esc_html( $name ); ?></span>
			<span class="wgba-footer-copy-links">
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'author' ) ); ?>">About</a>
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">Contact</a>
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'privacy' ) ); ?>">Privacy</a>
			</span>
		</div>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
