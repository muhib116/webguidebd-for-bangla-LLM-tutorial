<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
\WGBA\Templates::page_hero(
	array(
		'title'  => 'শর্তাবলি',
		'lead'   => 'কোর্স ব্যবহারের সাধারণ শর্ত।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'শর্তাবলি' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-card wgba-prose">
		<p>কোর্স বিনামূল্যে। সম্পূর্ণতা পেশাদার সার্টিফিকেশন বা চাকরির নিশ্চয়তা নয়। শিক্ষার্থী নিজ দায়িত্বে কোড ও সিদ্ধান্ত যাচাই করবেন।</p>
		<p>অন্যের কপিরাইট লঙ্ঘন করে কন্টেন্ট জমা দেওয়া যাবে না। অপব্যবহারে অ্যাকাউন্ট সীমিত করা হতে পারে।</p>
	</div>
</section>
<?php
\WGBA\Templates::footer();
