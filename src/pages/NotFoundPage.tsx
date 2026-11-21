import { Link } from 'react-router-dom'
import { PageHeading } from '../components/PageHeading'

export function NotFoundPage() {
  return <><PageHeading english="PAGE NOT FOUND" title="这个页面还不存在" description="可以通过左侧导航继续浏览，或返回学习主页。" /><Link className="button button-primary" to="/">返回学习主页</Link></>
}
