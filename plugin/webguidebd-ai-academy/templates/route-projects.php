<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();

$projects = array(
	array( 'slug' => 'niyom-vs-udahoron', 'title' => 'Ch1: নিয়ম বনাম উদাহরণ', 'note' => 'সিমুলেশন ডেমো — পাবলিক।', 'public' => true ),
	array( 'slug' => 'project-support-assistant', 'title' => 'Ch2: Support Assistant', 'note' => 'Rule-based বট — পাবলিক।', 'public' => true ),
	array( 'slug' => 'project-message-classifier', 'title' => 'Ch4: গ্রাহক-মেসেজ Classifier', 'note' => 'লগইন প্রয়োজন।', 'public' => false ),
	array( 'slug' => 'project-tiny-neural-network', 'title' => 'Ch5: ছোট Neural Network', 'note' => 'লগইন প্রয়োজন।', 'public' => false ),
	array( 'slug' => 'project-attention-calculator', 'title' => 'Ch8: Attention Calculator', 'note' => 'লগইন প্রয়োজন।', 'public' => false ),
	array( 'slug' => 'project-bangla-product-knowledge-assistant', 'title' => 'Ch11: বাংলা পণ্য-জ্ঞান সহকারী', 'note' => 'লগইন প্রয়োজন।', 'public' => false ),
	array( 'slug' => 'capstone-a-bengali-knowledge-assistant', 'title' => 'Ch14: ক্যাপস্টোন A', 'note' => 'লগইন প্রয়োজন।', 'public' => false ),
	array( 'slug' => 'capstone-b-reproducible-small-model-experiment', 'title' => 'Ch14: ক্যাপস্টোন B', 'note' => 'লগইন প্রয়োজন।', 'public' => false ),
);

\WGBA\Templates::page_hero(
	array(
		'title'  => 'প্রজেক্ট গ্যালারি',
		'lead'   => 'পাবলিক প্রজেক্ট বিনা লগইনে; বাকিগুলো বিনামূল্যে—লগইন করে পূর্ণ নির্দেশনা পড়ুন।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'প্রজেক্ট' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-section-head">
		<h2>Projects</h2>
		<a href="<?php echo esc_url( \WGBA\Rewrite::url( 'roadmap' ) ); ?>">Tutorials »</a>
	</div>
	<ul class="wgba-tut-list">
		<?php foreach ( $projects as $p ) : ?>
			<?php
			$logged  = is_user_logged_in();
			$badge_c = $p['public'] || $logged ? 'is-public' : 'is-login';
			$badge_t = $p['public'] ? 'Public' : ( $logged ? 'Unlocked' : 'Login' );
			?>
			<li>
				<a class="wgba-tut-item" href="<?php echo esc_url( \WGBA\Rewrite::url( 'lesson', $p['slug'] ) ); ?>">
					<span class="wgba-tut-meta">
						<span class="wgba-badge <?php echo esc_attr( $badge_c ); ?>"><?php echo esc_html( $badge_t ); ?></span>
					</span>
					<strong><?php echo esc_html( $p['title'] ); ?></strong>
					<p><?php echo esc_html( $p['note'] ); ?></p>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>
</section>
<?php
\WGBA\Templates::footer();
