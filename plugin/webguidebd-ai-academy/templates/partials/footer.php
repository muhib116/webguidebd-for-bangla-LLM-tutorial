<?php
/**
 * Academy footer — founder + site links.
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;
$p         = \WGBA\Site_Profile::get();
$name      = (string) $p['author_display_name'];
$photo     = \WGBA\Site_Profile::photo_url();
$logged_in = is_user_logged_in();
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
						height="40"
						alt="Web Guide BD"
						decoding="async"
						style="height:40px!important;width:auto!important;max-width:200px!important;max-height:40px!important;object-fit:contain!important;display:none!important"
					>
					<img
						class="wgba-brand-logo wgba-brand-logo-dark"
						src="<?php echo esc_url( \WGBA\Site_Profile::logo_url( 'dark' ) ); ?>"
						width="160"
						height="40"
						alt=""
						decoding="async"
						aria-hidden="true"
						style="height:40px!important;width:auto!important;max-width:200px!important;max-height:40px!important;object-fit:contain!important;display:block!important"
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
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">রোডম্যাপ</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'glossary' ) ); ?>">শব্দকোষ</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'projects' ) ); ?>">প্রজেক্ট গ্যালারি</a></li>
					<?php if ( $logged_in ) : ?>
						<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'dashboard' ) ); ?>">ড্যাশবোর্ড</a></li>
					<?php else : ?>
						<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'login' ) ); ?>">লগইন</a></li>
					<?php endif; ?>
				</ul>
			</div>
			<div>
				<p class="wgba-footer-heading">প্রতিষ্ঠান</p>
				<ul class="wgba-footer-list">
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'author' ) ); ?>">আমাদের সম্পর্কে</a></li>
					<li><a href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">যোগাযোগ</a></li>
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
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'author' ) ); ?>">আমাদের সম্পর্কে</a>
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">যোগাযোগ</a>
				<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'privacy' ) ); ?>">গোপনীয়তা</a>
			</span>
		</div>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
