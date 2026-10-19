<?php
/**
 * Academy chrome — calm top meta bar + topic subnav (logo = home).
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
				width="192"
				height="38"
				alt="Web Guide BD"
				decoding="async"
				style="height:38px!important;width:auto!important;max-width:192px!important;max-height:38px!important;object-fit:contain!important;display:block!important"
			>
			<img
				class="wgba-brand-logo wgba-brand-logo-dark"
				src="<?php echo esc_url( \WGBA\Site_Profile::logo_url( 'dark' ) ); ?>"
				width="192"
				height="38"
				alt=""
				decoding="async"
				aria-hidden="true"
				style="height:38px!important;width:auto!important;max-width:192px!important;max-height:38px!important;object-fit:contain!important;display:none!important"
			>
			<span class="wgba-sr-only">WebGuideBD AI Academy</span>
		</a>
		<nav class="wgba-nav wgba-nav-meta" aria-label="সাইট মেনু">
			<a class="<?php echo $is_author ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'author' ) ); ?>">আমাদের সম্পর্কে</a>
			<a class="<?php echo $is_contact ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'contact' ) ); ?>">যোগাযোগ</a>
		</nav>
		<div class="wgba-account" data-wgba-account>
			<button
				type="button"
				class="wgba-gear"
				data-wgba-gear
				aria-expanded="false"
				aria-haspopup="menu"
				aria-controls="wgba-account-menu"
				aria-label="সেটিংস"
			>
				<svg class="wgba-gear-ico" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
					<path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.34.66.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.24.12.52.02.66-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>
				</svg>
			</button>
			<div class="wgba-account-menu" id="wgba-account-menu" role="menu" hidden data-wgba-account-menu>
				<?php if ( $logged_in ) : ?>
					<a
						role="menuitem"
						class="wgba-account-item<?php echo $is_dash ? ' is-active' : ''; ?>"
						href="<?php echo esc_url( \WGBA\Rewrite::url( 'dashboard' ) ); ?>"
					>ড্যাশবোর্ড</a>
					<form class="wgba-account-form" method="post" action="" role="none">
						<?php wp_nonce_field( 'wgba_auth', 'wgba_auth_nonce' ); ?>
						<input type="hidden" name="wgba_auth_action" value="logout">
						<button type="submit" class="wgba-account-item" role="menuitem">লগআউট</button>
					</form>
				<?php else : ?>
					<a
						role="menuitem"
						class="wgba-account-item wgba-account-login"
						href="<?php echo esc_url( \WGBA\Rewrite::url( 'login' ) ); ?>"
					>লগইন</a>
				<?php endif; ?>
				<div class="wgba-account-sep" role="separator"></div>
				<button
					type="button"
					class="wgba-account-item wgba-theme-toggle"
					role="menuitem"
					data-wgba-theme-toggle
					aria-label="থিম বদলান"
				>
					<span class="wgba-theme-ico wgba-theme-ico-sun" aria-hidden="true">
						<svg width="16" height="16" viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1zm0 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5.5 11a1 1 0 0 1 1-1H8a1 1 0 1 1 0 2H6.5a1 1 0 0 1-1-1zm10.5 0a1 1 0 0 1 1-1H18a1 1 0 1 1 0 2h-1.5a1 1 0 0 1-1-1zM7.05 7.05a1 1 0 0 1 1.41 0L9.5 8.09A1 1 0 1 1 8.09 9.5L7.05 8.46a1 1 0 0 1 0-1.41zm7.45 7.45a1 1 0 0 1 1.41 0l1.04 1.04a1 1 0 0 1-1.41 1.41l-1.04-1.04a1 1 0 0 1 0-1.41zM12 16a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V17a1 1 0 0 1 1-1zm5.54-8.95a1 1 0 0 1 0 1.41L16.5 9.5A1 1 0 1 1 15.09 8.09l1.04-1.04a1 1 0 0 1 1.41 0zM8.09 15.09a1 1 0 0 1 0 1.41L7.05 17.54a1 1 0 0 1-1.41-1.41l1.04-1.04a1 1 0 0 1 1.41 0z"/></svg>
					</span>
					<span class="wgba-theme-ico wgba-theme-ico-moon" aria-hidden="true">
						<svg width="16" height="16" viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M12.1 2a1 1 0 0 1 .9 1.45A7.5 7.5 0 1 0 20.55 11a1 1 0 0 1 1.9-.3A9.5 9.5 0 1 1 12.1 2z"/></svg>
					</span>
					<span data-wgba-theme-label>ডার্ক</span>
					<span class="wgba-theme-suffix"> থিম</span>
				</button>
			</div>
		</div>
	</div>
</header>
<nav class="wgba-subnav" data-wgba-subnav aria-label="পাঠ্যক্রম মেনু">
	<div class="wgba-subnav-inner">
		<a class="<?php echo $is_roadmap ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">রোডম্যাপ</a>
		<a class="<?php echo $ch_ai ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'chapter', 'ai-o-llm-porichiti' ) ); ?>">AI ও LLM</a>
		<a class="<?php echo $ch_js ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'chapter', 'ai-shekhar-javascript' ) ); ?>">JavaScript</a>
		<a class="<?php echo $is_glossary ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'glossary' ) ); ?>">শব্দকোষ</a>
		<a class="<?php echo $is_projects ? 'is-active' : ''; ?>" href="<?php echo esc_url( \WGBA\Rewrite::url( 'projects' ) ); ?>">প্রজেক্ট</a>
	</div>
</nav>
<main id="wgba-main" class="wgba-main">
