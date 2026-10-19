<?php
defined( 'ABSPATH' ) || exit;
\WGBA\Templates::header();
\WGBA\Templates::page_hero(
	array(
		'title'  => 'গোপনীয়তা নীতি',
		'lead'   => 'AI Academy-তে আমরা কী তথ্য রাখি এবং কেন।',
		'crumbs' => array(
			array( 'label' => 'AI Academy', 'url' => \WGBA\Rewrite::url( 'home' ) ),
			array( 'label' => 'গোপনীয়তা' ),
		),
	)
);
?>
<section class="wgba-wrap wgba-section">
	<div class="wgba-card wgba-prose">
		<p>আমরা অ্যাকাউন্ট ও শেখার জন্য প্রয়োজনীয় তথ্য সংগ্রহ করি: ইমেইল/ইউজারনেম, অগ্রগতি, নোট, বুকমার্ক, কোড ড্রাফট, প্রশ্ন। অপ্রয়োজনীয় ফোন/ঠিকানা চাওয়া হয় না।</p>
		<p>ডেটা WordPress ডাটাবেসে থাকে; অ্যাক্সেস মালিক/অথরাইজড স্টাফের। ব্যক্তিগত এক্সপোর্ট ড্যাশবোর্ড থেকে পাওয়া যায়। WordPress Tools → Export/Erase Personal Data সমর্থিত।</p>
		<p>AdSense, অ্যানালিটিক্স ও AI tutor ডিফল্টে বন্ধ। সক্রিয় হলে সেই সময়ের প্রোভাইডার নীতি ও কনসেন্ট আপডেট করা হবে।</p>
		<p>সাইটের সাধারণ <a href="<?php echo esc_url( home_url( '/privacy-policy/' ) ); ?>">Privacy Policy</a>ও প্রযোজ্য।</p>
	</div>
</section>
<?php
\WGBA\Templates::footer();
