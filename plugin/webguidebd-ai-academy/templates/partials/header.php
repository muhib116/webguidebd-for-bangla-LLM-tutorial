<?php
/**
 * Academy chrome header — single Bangla navigation + mobile sheet.
 *
 * @package WebGuideBD\AIAcademy
 */

defined( 'ABSPATH' ) || exit;
$route = (string) get_query_var( 'wgba_route' );
$slug  = (string) get_query_var( 'wgba_slug' );

$ch_ai = ( 'chapter' === $route && 'ai-o-llm-porichiti' === $slug )
	|| ( 'lesson' === $route && isset( $GLOBALS['wgba_active_chapter'] ) && 'ch-01-ai-llm-intro' === $GLOBALS['wgba_active_chapter'] );
$ch_js = ( 'chapter' === $route && 'ai-shekhar-javascript' === $slug )
	|| ( 'lesson' === $route && isset( $GLOBALS['wgba_active_chapter'] ) && 'ch-02-js-fundamentals' === $GLOBALS['wgba_active_chapter'] );

$is_home     = ( 'home' === $route );
$is_roadmap  = ( 'roadmap' === $route );
$is_glossary = ( 'glossary' === $route || 'glossary_term' === $route );
$is_projects = ( 'projects' === $route );
$is_author   = ( 'author' === $route );
$is_contact  = ( 'contact' === $route );
$is_dash     = ( 'dashboard' === $route );
$logged_in   = is_user_logged_in();
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<script>
	(function () {
		try {
			var t = localStorage.getItem('wgba-theme');
			if (t !== 'dark' && t !== 'light') {
				t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
			}
			document.documentElement.setAttribute('data-wgba-theme', t);
		} catch (e) {
			document.documentElement.setAttribute('data-wgba-theme', 'light');
		}
	})();
	</script>
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'wgba-body' ); ?>>
<a class="wgba-skip" href="#wgba-main">মূল বিষয়ে যান</a>
<header class="wgba-top" data-wgba-top>
	<div class="wgba-top-inner">
		<a class="wgba-brand" href="<?php echo esc_url( \WGBA\Rewrite::url( 'home' ) ); ?>">
			<img
				class="wgba-brand-logo wgba-brand-logo-light"
				src="<?php echo esc_url( \WGBA\Site_Profile::logo_url( 'light' ) ); ?>"
				width="180"
				height="36"
				alt="Web Guide BD"
				decoding="async"
			>
			<img
				class="wgba-brand-logo wgba-brand-logo-dark"
				src="<?php echo esc_url( \WGBA\Site_Profile::logo_url( 'dark' ) ); ?>"
				width="180"
				height="36"
				alt=""
				decoding="async"
				aria-hidden="true"
			>
			<span class="wgba-sr-only">WebGuideBD AI Academy</span>
		</a>
		<button
			type="button"
			class="wgba-nav-toggle"
			data-wgba-nav-toggle
			aria-controls="wgba-nav"
			aria-expanded="false"
		>
			মেনু
		</button>
		<nav class="wgba-nav" id="wgba-nav" data-wgba-nav aria-label="প্রধান মেনু">
			<a class="<?php echo $is_home ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'home' ) ); ?>">হোম</a>
			<a class="<?php echo $is_roadmap ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">রোডম্যাপ</a>
			<a class="<?php echo $ch_ai ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'chapter', 'ai-o-llm-porichiti' ) ); ?>">AI ও LLM</a>
			<a class="<?php echo $ch_js ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'chapter', 'ai-shekhar-javascript' ) ); ?>">JavaScript</a>
			<a class="<?php echo $is_glossary ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'glossary' ) ); ?>">শব্দকোষ</a>
			<a class="<?php echo $is_projects ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'projects' ) ); ?>">প্রজেক্ট</a>
			<a class="<?php echo $is_author ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'author' ) ); ?>">আমাদের সম্পর্কে</a>
			<a class="<?php echo $is_contact ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">যোগাযোগ</a>
			<?php if ( $logged_in ) : ?>
				<a class="<?php echo $is_dash ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'dashboard' ) ); ?>">ড্যাশবোর্ড</a>
				<form class="wgba-inline-form" method="post" action="">
					<?php wp_nonce_field( 'wgba_auth', 'wgba_auth_nonce' ); ?>
					<input type="hidden" name="wgba_auth_action" value="logout">
					<button type="submit" class="wgba-linkish">লগআউট</button>
				</form>
			<?php endif; ?>
			<button type="button" class="wgba-theme-toggle" data-wgba-theme-toggle aria-label="থিম বদলান">
				<span class="wgba-theme-ico" aria-hidden="true">◐</span>
				<span class="wgba-theme-label" data-wgba-theme-label>ডার্ক</span>
			</button>
		</nav>
		<?php if ( ! $logged_in ) : ?>
			<a class="wgba-btn-login" href="<?php echo esc_url( \WGBA\Rewrite::url( 'login' ) ); ?>">লগইন</a>
		<?php endif; ?>
	</div>
</header>
<main id="wgba-main" class="wgba-main">
