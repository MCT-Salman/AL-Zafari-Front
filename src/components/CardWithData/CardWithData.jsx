import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { TrendingUp } from 'lucide-react'

const CardWithData = ({title,contentTitle, contentDesc, icon}) => {
    return (
        <Card className="bg-surface border border-primary hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2  text-text-strong">
                    {icon}
                   {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-text-strong">{contentTitle}</div>
                <p className="text-sm text-text-subtle mt-1">{contentDesc}</p>
            </CardContent>
        </Card>
    )
}

export default CardWithData