import type { GetStaticProps } from 'next'
import { getPosts } from '../utils/posts'
import { PostOrPage, PostsOrPages } from '@tryghost/content-api'
import Link from 'next/link'
import Footer from '../components/Footer/Footer'
import Head from "next/head";
import Header from '../components/Header/Header'
import pageStyles from '../styles/Page.module.css'
import blogStyles from '../styles/Blog.module.css'

 
export const getStaticProps: GetStaticProps<{posts: PostsOrPages}> = async () => {
    const posts = await getPosts()

    if (!posts) {
      return {
        notFound: true,
      }
    }
  
    return {
      props: { posts },
      revalidate: 60, // Revalidate every 1 minute
    }
}

function getReadingTime(slug: string) {
  // TODO: For some reason, the "reading_time" field is not being returned by the Ghost API
  // so we are calculating it manually for now. Get a hash of the slug, and then return a random
  // number between 4-7
  const hash = slug.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)
  const readingTime = Math.abs(hash % 3) + 4
  return readingTime + " min read"
}

function Post (props: {post: PostOrPage}) {

  return (
    <Link href={"/blog/" + props.post.slug} key={props.post.id}>
      <div className={blogStyles.post}>

        <h3>{props.post.title}</h3>
        <p className={blogStyles.excerpt}>
          {props.post.excerpt}...
        </p>
        <div className={blogStyles.post_metadata}>
          <div className={blogStyles.published_at}>
            {props.post.published_at &&
              new Intl.DateTimeFormat('en-US')
                .format(new Date(props.post.published_at))
            }
          </div>
          <div className={blogStyles.reading_time}>
            - {getReadingTime(props.post.slug)}
          </div>
        </div>

      </div>
    </Link>
  )
}
 
export default function Page(props: {posts: PostsOrPages}) {

  return (
    <>
      <Head>
        <title>Best Python Spreadsheet Automation & Code Generation | Mito </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

          <main className={pageStyles.main}>
            <div className={blogStyles.blog_title}>
              <h1> Mito Blog</h1>
              <p style={{marginTop: '0'}}>The best place to stay up to date with Mito&apos;s development, spreadsheets in Python, and more.</p>
            </div>

            <div className={blogStyles.posts_container}>
              {props.posts.map(post => (
                <Post post={post} key={post.slug} />
              ))}
            </div>            
        </main>

        <Footer />
      </div>
    </>
  )
}